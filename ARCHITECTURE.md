# Guía de Arquitectura y Funcionamiento: StockLimp

> **Documento Técnico Oficial**  
> **Sistema**: StockLimp Enterprise System  
> **Versión**: 2.4 Estable (Septiembre 2026)  
> **Stack**: React Native Web (Expo 54, React 19) + PHP 8.3 (Laravel 11/12) + MySQL 8.0 (InnoDB)  
> **Archivo PDF Compilado**: [ARCHITECTURE.pdf](file:///c:/xampp/htdocs/StockLimp/ARCHITECTURE.pdf)

---

## 1. Resumen Ejecutivo y Topología Global

**StockLimp** es una solución integral diseñada para la gestión logística de aprovisionamiento de productos de limpieza industrial, trazabilidad de rutas hacia centros de trabajo asignados, control horario de jornada laboral (fichajes con justificantes) y administración de vacaciones por días hábiles.

### Componentes de la Arquitectura
1. **Frontend Multiplataforma**: Construido sobre **Expo 54** y **React Native Web (React 19)** con **Expo Router 6**. Proporciona una interfaz unificada adaptativa (Web escritorio, tablet y móvil) con animaciones nativas y gráficos vectoriales SVG.
2. **Backend RESTful API**: Desarrollado en **PHP 8.3 / Laravel**, gestionando transacciones ACID concurrentes, políticas de autorización basadas en roles (RBAC), cola de envíos de correo asíncronos (`dispatch()->afterResponse()`) y generación de hojas de cálculo Excel XLSX.
3. **Persistencia y Almacenamiento**: Motor **MySQL 8.0 (InnoDB)** con integridad referencial estricta y llaves foráneas. Almacenamiento de fotos de perfil en Base64 procesadas en disco local y justificantes en el sistema de archivos de Laravel Storage.
4. **Infraestructura Contenedorizada**: Orquestación mediante Docker Compose (`stocklimp-db`, `stocklimp-back`, `stocklimp-front`) y configuración de despliegue en la nube mediante `render.yaml`.

---

## 2. Flujo de Datos de Entrada y Salida (E/S)

### 2.1. Ciclo de Autenticación y Recuperación
* **Petición**: `POST /api/usuarios/login` con `{ email, password }`.
* **Procesamiento**:
  - `UserController::login` evalúa credenciales verificando si el hash es Bcrypt (`$2y$`) o heredado.
  - Valida el estado de la cuenta: si está en `pendiente` o `rechazado`, deniega el acceso con código HTTP 403.
  - Si la contraseña coincide con la predeterminada (`12345`), activa la bandera `debe_cambiar_password: true`, forzando el diálogo de cambio obligatorio antes de liberar el dashboard.
* **Persistencia de Sesión**:
  - En entorno Web, la sesión se almacena en `sessionStorage.setItem('user', JSON.stringify(userData))`.
  - Al recargar la página, `HomeScreen` restaura automáticamente el estado del usuario.
* **Recuperación de Contraseña**:
  - `POST /api/usuarios/solicitar-restablecimiento`: Marca al usuario con `solicita_restablecimiento = 1`.
  - El administrador emite una contraseña temporal alfanumérica aleatoria de 8 caracteres mediante `POST /api/usuarios/enviar-restablecimiento`, enviada por correo con `PasswordResetMail`.

### 2.2. Ciclo de Vida de Pedidos
* **Petición**: `POST /api/pedidos/multiple` con `{ id_user, id_centro, productos: [{ id_producto, cantidad }], observaciones }`.
* **Restricción de Ventana Temporal**:
  - Los operarios estándar solo pueden crear o modificar pedidos **entre los días 2 y 8 de cada mes**.
  - Los administradores y super administradores disponen de privilegios para forzar pedidos fuera de periodo.
* **Transacción de Base de Datos**:
  - Se ejecuta dentro de un bloque `DB::transaction()`.
  - Inserta la cabecera en `pedidos` y luego cada línea en `detalle_pedido` calculando el importe de línea (`precio_unidad * cantidad`).
  - Ante cualquier error o producto inexistente, la base de datos realiza un rollback automático.
* **Transiciones de Estado y Notificaciones**:
  - Ciclo de estados: `PENDIENTE` &rarr; `EN_PREPARACION` &rarr; `DESPACHADO` &rarr; `ENTREGADO` (o `CANCELADO`).
  - Cuando un pedido cambia de estado, el backend despacha en segundo plano (`dispatch(...)->afterResponse()`) el correo `OrderStatusUpdated` hacia el usuario.

### 2.3. Control Horario (Fichajes y Justificantes)
* `POST /api/fichajes/actual`: Devuelve si el operario tiene una sesión activa (`trabajando` o `en_pausa`).
* `POST /api/fichajes/iniciar`: Registra la fecha y hora de entrada con Carbon en el servidor.
* `POST /api/fichajes/pausar`: Conmuta entre `trabajando` y `en_pausa`.
* `POST /api/fichajes/finalizar`: Cierra el turno, calcula la hora de salida y procesa archivos subidos (como partes médicos en formato PDF o imagen) almacenándolos en `storage/app/public/justificantes`.

### 2.4. Gestión de Vacaciones
* `GET /api/vacaciones/disponibles`: Calcula los días laborables hábiles consumidos en el año corriente y resta del cupo máximo anual (22 días laborables).
* `POST /api/vacaciones`: Algoritmo en `calcularDiasLaborables()` que itera entre las fechas seleccionadas y computa únicamente los días de lunes a viernes (`$current->isWeekday()`). Notifica por correo electrónico a todos los administradores (`VacationRequestedMail`).

---

## 3. Controladores y Servicios Principales (Backend)

| Controlador | Rutas Clave | Responsabilidad y Lógica |
| :--- | :--- | :--- |
| **UserController** | `/usuarios/login`<br>`/usuarios/aprobar`<br>`/usuarios/rechazar`<br>`/usuarios/update-role`<br>`/usuarios/update-profile`<br>`/usuarios/enviar-restablecimiento` | Gestión de identidades, altas por invitación con estado inicial `pendiente`, notificaciones de bienvenida y rechazo por email, actualización de perfil con almacenamiento de fotos en Base64 decodificado a JPG/PNG en `public/uploads/profiles`. **Protección de Seguridad:** Bloquea la eliminación o degradación de rol del último `super_admin` activo del sistema. |
| **OrderController** | `/pedidos`<br>`/pedidos/multiple`<br>`/pedidos/update-status`<br>`/pedidos/update-multiple`<br>`/pedidos/update-details`<br>`/pedidos/exportar` | Gestión de cabecera y detalle de pedidos. Emplea `DB::transaction()` para garantizar atomicidad. Bloquea modificaciones fuera de los días 2 al 8 del mes a usuarios estándar. Despacha correos asíncronos con `dispatch()->afterResponse()`. |
| **ProductController** | `/productos`<br>`/productos/update`<br>`/productos/delete`<br>`/productos/exportar` | Catálogo maestro de productos y químicos. Controla SKU único, precios unitarios, stock actual, banderas de toxicidad (`es_toxico`) y generación de archivo Excel XLSX mediante `ProductExport`. |
| **CenterController** | `/centros_trabajo`<br>`/centros_trabajo/update`<br>`/centros_trabajo/delete` | Centros de trabajo vinculados a rutas logísticas (1 a 17) y ciudades. **Auto-Sanación:** Su constructor verifica dinámicamente mediante `Schema::hasColumn` la existencia de columnas críticas (`ciudad`, `numero_ruta`, `fecha_registro`), ejecutando migraciones silenciosas si faltan. |
| **TimeTrackingController** | `/fichajes/actual`<br>`/fichajes/iniciar`<br>`/fichajes/pausar`<br>`/fichajes/finalizar` | Máquina de estados de presencia horaria (`trabajando` &harr; `en_pausa` &rarr; `finalizado`). Estampación horaria con Carbon y adjunto de documentos en `public/justificantes`. |
| **VacacionController** | `/vacaciones/disponibles`<br>`/vacaciones`<br>`/vacaciones/mis-vacaciones`<br>`/vacaciones/todas`<br>`/vacaciones/{id}/estado`<br>`/vacaciones/{id}/cancelar` | Motor de cálculo de días hábiles. Valida el cupo anual legal (22 días). Notifica por email a los administradores ante solicitudes de empleados y gestiona cancelaciones. |

---

## 4. Manejo de Base de Datos y Modelo Relacional

El esquema se encuentra normalizado en MySQL con motor InnoDB:

```
+------------------+         +------------------+         +------------------+
| centros_trabajo  |         |      users       |         |     pedidos      |
+------------------+         +------------------+         +------------------+
| id_centro (PK)   |<---+    | id_user (PK)     |<---+    | id_pedido (PK)   |
| nombre_centro    |    |    | email (UNIQUE)   |    |    | id_user (FK)     |
| numero_ruta (1-17)|   +----| id_centro (FK)   |    +----| id_centro (FK)   |
| direccion, ciudad|         | rol, estado      |         | estado, fecha    |
+------------------+         +------------------+         +------------------+
                                      |                            |
                                      |                            v
                                      |                  +--------------------+
                                      |                  |   detalle_pedido   |
                                      |                  +--------------------+
                                      |                  | id_pedido (PK, FK) |
                                      |                  | id_producto (PK,FK)|
                                      |                  | cantidad, subtotal |
                                      |                  +--------------------+
                                      |                            |
                                      v                            v
                            +--------------------+       +--------------------+
                            | fichajes/vacaciones|       |     productos      |
                            +--------------------+       +--------------------+
                            | id (PK)            |       | id_producto (PK)   |
                            | id_user (FK)       |       | sku (UNIQUE)       |
                            | horas / fechas     |       | nombre, precio, stk|
                            +--------------------+       +--------------------+
```

### Principales Tablas
1. **`users`**: Almacena credenciales, rol (`super_admin`, `admin`, `usuario`, `repartidor`), estado (`activo`, `pendiente`, `rechazado`) y centro principal de trabajo.
2. **`centros_trabajo`**: Puntos físicos de entrega agrupados en 17 rutas de distribución.
3. **`productos`**: Insumos y químicos con SKU, stock, precio unitario y marcaje de riesgo toxicológico.
4. **`pedidos`**: Cabecera de suministros solicitados por centro y fecha.
5. **`detalle_pedido`**: Tabla pivote que desglosa las cantidades requeridas de cada producto y calcula el precio total por línea.
6. **`fichajes`**: Registros de presencia diaria con marcas de tiempo y enlaces a ficheros adjuntos.
7. **`vacaciones`**: Solicitudes de días de descanso con estados de aprobación y rango de fechas.

---

## 5. Componentes Frontend y Manejo de Estado

* **`HomeScreen` (`src/app/index.tsx`)**: Orquestador principal, evaluador de roles, control de sidebar adaptativo y motor del **Asistente Virtual (Chatbot inteligente)** para resolución guiada de incidencias (olvido de contraseña, fechas hábiles de pedidos, etc.).
* **`OrdersView.tsx`**: Panel integral de pedidos con filtros por número de ruta, acciones masivas (cambio de estado en lote a `ENTREGADO`), exportación a Excel y modal de verificación del periodo 2 al 8.
* **`TimeTrackingView.tsx`**: Temporizador en tiempo real con anillos de progreso circulares SVG, selector de justificantes con `expo-document-picker` y calendario de vacaciones con `react-native-calendars` localizado al español.
* **`AnalyticsView.tsx`**: Dashboard de analítica visual con gráficos interactivos SVG (donut de reparto de cuota y barras de consumo comparativo 2025 vs 2026).
* **`ControlPanelView.tsx`**: Panel de gestión de usuarios, reasignación de roles y envío de claves provisionales por correo.
* **`VacationsAdminView.tsx`**: Consola de supervisión para que los administradores autoricen o denieguen solicitudes de vacaciones de operarios.
* **`ApproveUsersView.tsx`**: Gestión de solicitudes de registro pendientes de aprobación por el Super Administrador.
* **`ProfileView.tsx`**: Gestión de datos de contacto y fotografía de perfil con codificación a Base64 y validación de 5 MB.

---

## 6. Seguridad y Despliegue

### Matriz de Roles (RBAC)
* **`super_admin`**: Control total del sistema, única figura facultada para admitir altas pendientes y nombrar nuevos administradores.
* **`admin`**: Gestión logística completa de pedidos, stock, centros de trabajo y aprobación de vacaciones.
* **`repartidor`**: Visualización de pedidos agrupados por número de ruta y confirmación de entregas masivas.
* **`usuario`**: Operario asignado a centro de trabajo. Acceso exclusivo a sus pedidos dentro del periodo reglamentario (días 2 al 8) y fichaje de jornada laboral.

### Comandos de Ejecución
```bash
# Iniciar Backend (Laravel)
cd back && php artisan serve --port=8000

# Iniciar Frontend (Expo Web)
cd front && npm run web

# Despliegue integral con Docker
docker-compose up -d --build
```
