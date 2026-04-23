-- ============================================================
-- BASE DE DATOS: stocklimp
-- Descripción: Gestión de inventario, productos químicos y pedidos.
-- ============================================================

CREATE DATABASE IF NOT EXISTS `stocklimp` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `stocklimp`;

-- 1. TABLA: Usuarios
CREATE TABLE `users` (
  `id_user` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `rol` VARCHAR(20) NOT NULL DEFAULT 'usuario',
  `fecha_creacion` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB;

-- 2. TABLA: Centros de Trabajo
CREATE TABLE `centros_trabajo` (
  `id_centro` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre_centro` VARCHAR(100) NOT NULL,
  `direccion` VARCHAR(255) NOT NULL,
  `contacto` VARCHAR(100) DEFAULT NULL,
  `telefono` VARCHAR(20) DEFAULT NULL,
  PRIMARY KEY (`id_centro`)
) ENGINE=InnoDB;

-- 3. TABLA: Productos
CREATE TABLE `productos` (
  `id_producto` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(100) NOT NULL,
  `sku` VARCHAR(50) DEFAULT NULL,
  `es_toxico` TINYINT(1) DEFAULT 0,
  `precio_unidad` DECIMAL(10,2) NOT NULL,
  `stock_actual` DECIMAL(10,2) DEFAULT 0.00,
  `fecha_registro` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  PRIMARY KEY (`id_producto`),
  UNIQUE KEY `sku` (`sku`)
) ENGINE=InnoDB;

-- 4. TABLA: Componentes Químicos (Seguridad)
CREATE TABLE `producto_componentes` (
  `id_componente` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_producto` INT(10) UNSIGNED NOT NULL,
  `nombre_componente` VARCHAR(100) NOT NULL,
  `porcentaje` VARCHAR(10) DEFAULT NULL,
  `descripcion_seguridad` TEXT DEFAULT NULL,
  PRIMARY KEY (`id_componente`),
  CONSTRAINT `fk_componente_producto` FOREIGN KEY (`id_producto`) 
    REFERENCES `productos` (`id_producto`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 5. TABLA: Pedidos (Cabecera)
CREATE TABLE `pedidos` (
  `id_pedido` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `fecha_salida_almacen` DATETIME DEFAULT NULL,
  `estado` ENUM('PENDIENTE','EN_PREPARACION','DESPACHADO','ENTREGADO','CANCELADO') NOT NULL DEFAULT 'PENDIENTE',
  `id_user` INT(10) UNSIGNED NOT NULL,
  `id_centro` INT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`id_pedido`),
  CONSTRAINT `fk_pedido_user` FOREIGN KEY (`id_user`) 
    REFERENCES `users` (`id_user`) ON UPDATE CASCADE,
  CONSTRAINT `fk_pedido_centro` FOREIGN KEY (`id_centro`) 
    REFERENCES `centros_trabajo` (`id_centro`) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 6. TABLA: Detalle de Pedido (Líneas de pedido)
CREATE TABLE `detalle_pedido` (
  `id_pedido` INT(10) UNSIGNED NOT NULL,
  `id_producto` INT(10) UNSIGNED NOT NULL,
  `cantidad_solicitada` DECIMAL(10,2) NOT NULL,
  `precio_total_linea` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id_pedido`, `id_producto`),
  CONSTRAINT `fk_detalle_pedido` FOREIGN KEY (`id_pedido`) 
    REFERENCES `pedidos` (`id_pedido`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_producto` FOREIGN KEY (`id_producto`) 
    REFERENCES `productos` (`id_producto`) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- VOLCADO DE DATOS INICIALES
-- ============================================================

INSERT INTO `users` (`nombre`, `email`, `password_hash`, `rol`) VALUES
('Oscar Mangut', 'oscar@stocklimp.com', 'admin123', 'admin'),
('Admin Sistema', 'admin@stocklimp.com', 'admin123', 'admin'),
('Operario Almacén', 'almacen@stocklimp.com', 'admin123', 'usuario'),
('pepe', 'pepe@stocklimp.com', 'pepe123', 'usuario'),
('andrea', 'andrea@stocklimp.com', 'andrea123', 'usuario');

INSERT INTO `centros_trabajo` (`nombre_centro`, `direccion`, `contacto`, `telefono`) VALUES
('Almacén Central Cáceres', 'Polígono Industrial Las Capellanías, Nave 5', 'Juan Pedro Pérez', '927112233'),
('Sede Administrativa', 'Avenida de la Montaña 12, 10004 Cáceres', 'María García', '927445566'),
('Centro Logístico Norte', 'Calle de la Industria 45, Plasencia', 'Roberto Solís', '927778899');

INSERT INTO `productos` (`id_producto`, `nombre`, `sku`, `es_toxico`, `precio_unidad`, `stock_actual`) VALUES
(1, 'Detergente Industrial', 'DET-IND-001', 0, 12.50, 100.00),
(2, 'Lejía Concentrada', 'LEJ-CON-002', 1, 24.95, 50.00),
(3, 'Detergente Textil Profesional', 'DET-TEX-003', 0, 18.20, 85.00),
(4, 'Limpia Cristales Concentrado', 'CRI-CONC-004', 0, 8.45, 120.00),
(5, 'Desengrasante Ácido Fuerte', 'DEG-ACID-005', 1, 32.10, 15.00),
(6, 'Ambientador Bosque 1L', 'AMB-BOS-006', 0, 5.75, 200.00),
(7, 'Lejia con olor', '', 0, 1.00, 120.00),
(22, 'Lejia casa', '123', 0, 20.00, 2.00);

INSERT INTO `producto_componentes` (`id_producto`, `nombre_componente`, `porcentaje`, `descripcion_seguridad`) VALUES
(1, 'Agua desionizada', '85%', 'Base neutra.'),
(1, 'Tensioactivos no iónicos', '10%', 'Biodegradable.'),
(1, 'Perfume Limón', '5%', 'Evitar contacto prolongado.'),
(2, 'Hipoclorito de Sodio', '40%', 'Corrosivo. Usar guantes.'),
(5, 'Ácido Sulfúrico', '25%', 'PELIGRO: Provoca quemaduras graves.');

INSERT INTO `pedidos` (`id_pedido`, `fecha_creacion`, `estado`, `id_user`, `id_centro`) VALUES
(1, '2026-02-20 00:00:00', 'DESPACHADO', 1, 1),
(2, '2026-04-23 00:00:00', 'EN_PREPARACION', 1, 3),
(3, '2026-02-15 10:00:00', 'ENTREGADO', 2, 2),
(4, '2026-04-23 16:39:32', 'PENDIENTE', 4, 1);

INSERT INTO `detalle_pedido` (`id_pedido`, `id_producto`, `cantidad_solicitada`, `precio_total_linea`) VALUES
(1, 1, 10.00, 125.00),
(1, 4, 5.00, 42.25),
(2, 2, 2.00, 49.90),
(3, 6, 20.00, 115.00);