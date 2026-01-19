-- --------------------------------------------------------
-- SCRIPT DDL PARA EL PROYECTO DE CONTROL DE STOCK
-- Base de Datos: StockLimp (Nombre sugerido)
-- Motor: InnoDB (Necesario para Foreign Keys)
-- --------------------------------------------------------

-- 1. CREACIÓN Y USO DE LA BASE DE DATOS
CREATE DATABASE IF NOT EXISTS StockLimp;
USE StockLimp;

-- 2. TABLA USERS (Usuarios del Sistema)
CREATE TABLE IF NOT EXISTS USERS (
    id_user INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- Siempre almacenar HASHES de contraseñas
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

-- 4. TABLA PRODUCTOS (Catálogo de Artículos de Limpieza)
CREATE TABLE IF NOT EXISTS PRODUCTOS (
    id_producto INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    sku VARCHAR(50) UNIQUE, -- Stock Keeping Unit: Código de identificación único
    es_toxico BOOLEAN DEFAULT FALSE,
    precio_unidad DECIMAL(10, 2) NOT NULL,
    stock_actual DECIMAL(10, 2) DEFAULT 0,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. TABLA PEDIDOS (Registro de Solicitudes de Material)
CREATE TABLE IF NOT EXISTS PEDIDOS (
    id_pedido INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    fecha_creacion DATETIME NOT NULL,
    fecha_salida_almacen DATETIME NULL, -- Puede ser NULL hasta que se despache
    estado ENUM('PENDIENTE', 'EN_PREPARACION', 'DESPACHADO', 'ENTREGADO', 'CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
    
    -- CLAVES FORÁNEAS
    id_user INT UNSIGNED NOT NULL, -- Quién creó/registró el pedido
    id_centro INT UNSIGNED NOT NULL, -- Destino del pedido
    
    FOREIGN KEY (id_user) REFERENCES USERS(id_user) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_centro) REFERENCES CENTROS_TRABAJO(id_centro) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 6. TABLA DETALLE_PEDIDO (Detalles de Productos dentro de cada Pedido)
-- Resuelve la relación N:M entre PEDIDOS y PRODUCTOS
CREATE TABLE IF NOT EXISTS DETALLE_PEDIDO (
    id_pedido INT UNSIGNED,
    id_producto INT UNSIGNED,
    cantidad_solicitada DECIMAL(10, 2) NOT NULL,
    precio_total_linea DECIMAL(10, 2) NOT NULL,
    
    -- CLAVE PRIMARIA COMPUESTA
    PRIMARY KEY (id_pedido, id_producto),
    
    -- CLAVES FORÁNEAS
    FOREIGN KEY (id_pedido) REFERENCES PEDIDOS(id_pedido) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES PRODUCTOS(id_producto) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;