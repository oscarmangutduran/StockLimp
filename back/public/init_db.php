<?php
header("Content-Type: text/plain; charset=UTF-8");
try {
    // 1. Conectar a MySQL
    $db = new PDO("mysql:host=127.0.0.1;charset=utf8", "root", "");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Conectado a MySQL con éxito.\n";

    // 2. Re-crear base de datos stocklimp para asegurar coincidencia exacta de columnas
    $db->exec("DROP DATABASE IF EXISTS `stocklimp`;");
    $db->exec("CREATE DATABASE `stocklimp` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
    echo "Base de datos `stocklimp` re-creada.\n";

    $db->exec("USE `stocklimp`;");

    // 3. Crear tabla `usuarios` (con columna `rol` requerida por Laravel y Front-end)
    $db->exec("CREATE TABLE `usuarios` (
        `id_user` INT AUTO_INCREMENT PRIMARY KEY,
        `nombre` VARCHAR(100) NOT NULL,
        `email` VARCHAR(100) UNIQUE NOT NULL,
        `password` VARCHAR(255) NOT NULL,
        `rol` VARCHAR(50) NOT NULL DEFAULT 'user'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    echo "Tabla `usuarios` creada.\n";

    // 4. Crear tabla `productos` (con columna `stock_actual` requerida por Laravel y Front-end)
    $db->exec("CREATE TABLE `productos` (
        `id_producto` INT AUTO_INCREMENT PRIMARY KEY,
        `nombre` VARCHAR(100) NOT NULL,
        `sku` VARCHAR(100) NULL,
        `precio_unidad` DECIMAL(10,2) NOT NULL,
        `stock_actual` INT NOT NULL,
        `es_toxico` TINYINT(1) DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    echo "Tabla `productos` creada.\n";

    // 5. Crear tabla `pedidos` (con claves foráneas y columnas correctas)
    $db->exec("CREATE TABLE `pedidos` (
        `id_pedido` INT AUTO_INCREMENT PRIMARY KEY,
        `id_user` INT NOT NULL,
        `fecha_pedido` DATETIME NOT NULL,
        `estado` VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE',
        FOREIGN KEY (`id_user`) REFERENCES `usuarios` (`id_user`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    echo "Tabla `pedidos` creada.\n";

    // 6. Crear tabla `detalle_pedido` (para desglose del carrito de pedidos múltiples)
    $db->exec("CREATE TABLE `detalle_pedido` (
        `id_pedido` INT NOT NULL,
        `id_producto` INT NOT NULL,
        `cantidad` INT NOT NULL,
        PRIMARY KEY (`id_pedido`, `id_producto`),
        FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE CASCADE,
        FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    echo "Tabla `detalle_pedido` creada.\n";

    // 7. Crear tabla `centros_trabajo`
    $db->exec("CREATE TABLE `centros_trabajo` (
        `id_centro` INT AUTO_INCREMENT PRIMARY KEY,
        `nombre` VARCHAR(100) NOT NULL,
        `direccion` VARCHAR(255) NOT NULL,
        `ciudad` VARCHAR(100) NOT NULL,
        `fecha_registro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;");
    echo "Tabla `centros_trabajo` creada.\n";

    // 8. Poblar usuarios (Administrador y Operario estándar)
    // Usamos tanto password_hash para bcrypt como texto plano para asegurar compatibilidad
    $passAdmin = password_hash('admin123', PASSWORD_DEFAULT);
    $passUser = password_hash('operario123', PASSWORD_DEFAULT);

    $stmt = $db->prepare("INSERT INTO `usuarios` (`nombre`, `email`, `password`, `rol`) VALUES (?, ?, ?, ?)");
    $stmt->execute(['Administrador StockLimp', 'admin@stocklimp.com', $passAdmin, 'admin']);
    $stmt->execute(['Operario Juan', 'operario@stocklimp.com', $passUser, 'user']);
    $stmt->execute(['Oscar Mangut', 'oscar@stocklimp.com', $passAdmin, 'admin']);
    echo "Usuarios iniciales insertados (admin@stocklimp.com / operario@stocklimp.com).\n";

    // 9. Poblar productos
    $stmt = $db->prepare("INSERT INTO `productos` (`nombre`, `sku`, `precio_unidad`, `stock_actual`, `es_toxico`) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute(['Detergente Multiusos', 'DET-MULTI-01', 4.50, 150, 0]);
    $stmt->execute(['Desinfectante de Cloro', 'DES-CLORO-02', 2.80, 4, 1]); // stock bajo para testear alerta visual
    $stmt->execute(['Limpia Cristales Premium', 'LIMP-CRIS-03', 3.20, 200, 0]);
    echo "Productos iniciales insertados.\n";

    // 10. Poblar centros de trabajo
    $stmt = $db->prepare("INSERT INTO `centros_trabajo` (`nombre`, `direccion`, `ciudad`) VALUES (?, ?, ?)");
    $stmt->execute(['Sede Central Madrid', 'Paseo de la Castellana 123', 'Madrid']);
    $stmt->execute(['Sucursal Barcelona', 'Avinguda Diagonal 456', 'Barcelona']);
    echo "Centros de trabajo iniciales insertados.\n";

    // 11. Poblar pedidos de prueba
    $id_user = 2; // Operario Juan
    $db->exec("INSERT INTO `pedidos` (`id_user`, `fecha_pedido`, `estado`) VALUES ($id_user, NOW(), 'PENDIENTE');");
    $id_pedido = $db->lastInsertId();
    $db->exec("INSERT INTO `detalle_pedido` (`id_pedido`, `id_producto`, `cantidad`) VALUES ($id_pedido, 1, 10);");
    $db->exec("INSERT INTO `detalle_pedido` (`id_pedido`, `id_producto`, `cantidad`) VALUES ($id_pedido, 2, 5);");
    echo "Pedidos de prueba iniciales insertados.\n";

    echo "\nBase de datos de Laravel inicializada exitosamente en MySQL.";

} catch (Exception $e) {
    echo "Error en la inicialización: " . $e->getMessage();
}
