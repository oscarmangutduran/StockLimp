-- 1. BASE DE DATOS
CREATE DATABASE IF NOT EXISTS StockLimp;
USE StockLimp;

-- 2. TABLA USERS (Usuarios del Sistema)
CREATE TABLE IF NOT EXISTS USERS (
    id_user INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. TABLA CENTROS_TRABAJO (Ubicaciones de Entrega)
CREATE TABLE IF NOT EXISTS CENTROS_TRABAJO (
    id_centro INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre_centro VARCHAR(100) NOT NULL,
    direccion VARCHAR(255) NOT NULL,
    contacto VARCHAR(100),
    telefono VARCHAR(20)
) ENGINE=InnoDB;

-- 4. TABLA PRODUCTOS
CREATE TABLE IF NOT EXISTS PRODUCTOS (
    id_producto INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    sku VARCHAR(50) UNIQUE,
    es_toxico BOOLEAN DEFAULT FALSE,
    precio_unidad DECIMAL(10, 2) NOT NULL,
    stock_actual DECIMAL(10, 2) DEFAULT 0,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. TABLA PRODUCTO_COMPONENTES (NUEVA: Para el botón de información)
-- Esta tabla almacena los químicos o ingredientes de cada producto
CREATE TABLE IF NOT EXISTS PRODUCTO_COMPONENTES (
    id_componente INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_producto INT UNSIGNED NOT NULL,
    nombre_componente VARCHAR(100) NOT NULL,
    porcentaje VARCHAR(10) DEFAULT NULL, -- Ejemplo: '15%', '500ml/L'
    descripcion_seguridad TEXT,
    
    FOREIGN KEY (id_producto) REFERENCES PRODUCTOS(id_producto) 
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. TABLA PEDIDOS
CREATE TABLE IF NOT EXISTS PEDIDOS (
    id_pedido INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_salida_almacen DATETIME NULL,
    estado ENUM('PENDIENTE', 'EN_PREPARACION', 'DESPACHADO', 'ENTREGADO', 'CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
    id_user INT UNSIGNED NOT NULL,
    id_centro INT UNSIGNED NOT NULL,
    
    FOREIGN KEY (id_user) REFERENCES USERS(id_user) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_centro) REFERENCES CENTROS_TRABAJO(id_centro) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 7. TABLA DETALLE_PEDIDO
CREATE TABLE IF NOT EXISTS DETALLE_PEDIDO (
    id_pedido INT UNSIGNED,
    id_producto INT UNSIGNED,
    cantidad_solicitada DECIMAL(10, 2) NOT NULL,
    precio_total_linea DECIMAL(10, 2) NOT NULL,
    
    PRIMARY KEY (id_pedido, id_producto),
    FOREIGN KEY (id_pedido) REFERENCES PEDIDOS(id_pedido) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES PRODUCTOS(id_producto) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;



//Datos de ejemplo
USE StockLimp;

-- 1. DATOS PARA USUARIOS (USERS)
-- Contraseña por defecto: admin123
INSERT INTO USERS (nombre, email, password_hash) VALUES 
('Oscar Mangut', 'oscar@stocklimp.com', 'admin123'),
('Admin Sistema', 'admin@stocklimp.com', 'admin123'),
('Operario Almacén', 'almacen@stocklimp.com', 'admin123');

-- 2. DATOS PARA CENTROS DE TRABAJO (CENTROS_TRABAJO)
INSERT INTO CENTROS_TRABAJO (nombre_centro, direccion, contacto, telefono) VALUES 
('Almacén Central Cáceres', 'Polígono Industrial Las Capellanías, Nave 5', 'Juan Pérez', '927112233'),
('Sede Administrativa', 'Avenida de la Montaña 12, 10004 Cáceres', 'María García', '927445566'),
('Centro Logístico Norte', 'Calle de la Industria 45, Plasencia', 'Roberto Solís', '927778899');

-- 3. DATOS PARA PRODUCTOS (PRODUCTOS)
INSERT INTO PRODUCTOS (nombre, sku, es_toxico, precio_unidad, stock_actual) VALUES 
('Limpiador Multiusos 5L', 'LIM-MULTI-001', 0, 12.50, 150.00),
('Desinfectante Industrial Clorado', 'DES-CLOR-002', 1, 24.95, 40.00),
('Detergente Textil Profesional', 'DET-TEX-003', 0, 18.20, 85.00),
('Limpia Cristales Concentrado', 'CRI-CONC-004', 0, 8.45, 120.00),
('Desengrasante Ácido Fuerte', 'DEG-ACID-005', 1, 32.10, 15.00),
('Ambientador Bosque 1L', 'AMB-BOS-006', 0, 5.75, 200.00);

-- 4. DATOS PARA COMPONENTES (PRODUCTO_COMPONENTES)
-- Componentes para Limpiador Multiusos (ID 1)
INSERT INTO PRODUCTO_COMPONENTES (id_producto, nombre_componente, porcentaje, descripcion_seguridad) VALUES 
(1, 'Agua desionizada', '85%', 'Base neutra.'),
(1, 'Tensioactivos no iónicos', '10%', 'Biodegradable.'),
(1, 'Perfume Limón', '5%', 'Evitar contacto prolongado con la piel.');

-- Componentes para Desinfectante Clorado (ID 2)
INSERT INTO PRODUCTO_COMPONENTES (id_producto, nombre_componente, porcentaje, descripcion_seguridad) VALUES 
(2, 'Hipoclorito de Sodio', '40%', 'Altamente corrosivo. Usar guantes y ventilación.'),
(2, 'Agua', '55%', 'Disolvente.'),
(2, 'Estabilizantes', '5%', 'Mantener en lugar fresco.');

-- Componentes para Desengrasante Ácido (ID 5)
INSERT INTO PRODUCTO_COMPONENTES (id_producto, nombre_componente, porcentaje, descripcion_seguridad) VALUES 
(5, 'Ácido Sulfúrico', '25%', 'PELIGRO: Provoca quemaduras graves. Protección total.'),
(5, 'Ácido Fosfórico', '15%', 'Uso restringido a profesionales.'),
(5, 'Agua', '60%', 'Disolvente.');

-- 5. DATOS PARA PEDIDOS (PEDIDOS)
-- Pedido 1: Pendiente de Oscar para el Almacén Central
INSERT INTO PEDIDOS (fecha_creacion, estado, id_user, id_centro) VALUES 
(NOW(), 'PENDIENTE', 1, 1);

-- Pedido 2: En preparación para el Centro Norte
INSERT INTO PEDIDOS (fecha_creacion, estado, id_user, id_centro) VALUES 
(NOW(), 'EN_PREPARACION', 1, 3);

-- Pedido 3: Ya entregado
INSERT INTO PEDIDOS (fecha_creacion, fecha_salida_almacen, estado, id_user, id_centro) VALUES 
('2026-02-15 10:00:00', '2026-02-16 09:00:00', 'ENTREGADO', 2, 2);

-- 6. DATOS PARA DETALLE DE PEDIDO (DETALLE_PEDIDO)
-- Detalles del Pedido 1
INSERT INTO DETALLE_PEDIDO (id_pedido, id_producto, cantidad_solicitada, precio_total_linea) VALUES 
(1, 1, 10.00, 125.00),
(1, 4, 5.00, 42.25);

-- Detalles del Pedido 2
INSERT INTO DETALLE_PEDIDO (id_pedido, id_producto, cantidad_solicitada, precio_total_linea) VALUES 
(2, 2, 2.00, 49.90),
(2, 5, 1.00, 32.10);

-- Detalles del Pedido 3
INSERT INTO DETALLE_PEDIDO (id_pedido, id_producto, cantidad_solicitada, precio_total_linea) VALUES 
(3, 6, 20.00, 115.00);