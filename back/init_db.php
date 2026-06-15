<?php
header("Content-Type: text/plain");
try {
    // 1. Conectar a MySQL sin base de datos
    $db = new PDO("mysql:host=localhost;charset=utf8", "root", "");
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Conectado a MySQL con éxito.\n";

    // 2. Crear base de datos
    $db->exec("CREATE DATABASE IF NOT EXISTS `stocklimp` CHARACTER SET utf8 COLLATE utf8_general_ci;");
    echo "Base de datos `stocklimp` creada o ya existente.\n";

    // Conectar a la base de datos creada
    $db->exec("USE `stocklimp`;");

    // 3. Crear tabla `usuarios`
    $db->exec("CREATE TABLE IF NOT EXISTS `usuarios` (
        `id_user` INT AUTO_INCREMENT PRIMARY KEY,
        `nombre` VARCHAR(100) NOT NULL,
        `email` VARCHAR(100) UNIQUE NOT NULL,
        `password` VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;");
    echo "Tabla `usuarios` creada.\n";

    // 4. Crear tabla `productos`
    $db->exec("CREATE TABLE IF NOT EXISTS `productos` (
        `id_producto` INT AUTO_INCREMENT PRIMARY KEY,
        `nombre` VARCHAR(100) NOT NULL,
        `descripcion` TEXT,
        `precio_unidad` DECIMAL(10,2) NOT NULL,
        `stock` INT NOT NULL,
        `es_toxico` TINYINT(1) DEFAULT 0,
        `fecha_registro` DATE NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;");
    echo "Tabla `productos` creada.\n";

    // 5. Crear tabla `pedidos`
    $db->exec("CREATE TABLE IF NOT EXISTS `pedidos` (
        `id_pedido` INT AUTO_INCREMENT PRIMARY KEY,
        `producto` VARCHAR(100) NOT NULL,
        `cantidad` INT NOT NULL,
        `precio_total` DECIMAL(10,2) NOT NULL,
        `fecha_pedido` DATE NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;");
    echo "Tabla `pedidos` creada.\n";

    // 6. Crear tabla `centros_trabajo`
    $db->exec("CREATE TABLE IF NOT EXISTS `centros_trabajo` (
        `id_centro` INT AUTO_INCREMENT PRIMARY KEY,
        `nombre` VARCHAR(100) NOT NULL,
        `direccion` VARCHAR(255) NOT NULL,
        `telefono` VARCHAR(20) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;");
    echo "Tabla `centros_trabajo` creada.\n";

    // 7. Insertar administrador por defecto (si no existe)
    $email = 'admin@stocklimp.com';
    $stmt = $db->prepare("SELECT COUNT(*) FROM `usuarios` WHERE `email` = ?");
    $stmt->execute([$email]);
    if ($stmt->fetchColumn() == 0) {
        $nombre = 'Admin StockLimp';
        $passHash = password_hash('admin123', PASSWORD_DEFAULT);
        $stmtInsert = $db->prepare("INSERT INTO `usuarios` (`nombre`, `email`, `password`) VALUES (?, ?, ?)");
        $stmtInsert->execute([$nombre, $email, $passHash]);
        echo "Usuario administrador creado por defecto (admin@stocklimp.com / admin123).\n";
    } else {
        echo "El usuario administrador ya existía.\n";
    }

    // 8. Insertar datos de prueba en `productos` si está vacía
    $stmt = $db->query("SELECT COUNT(*) FROM `productos`");
    if ($stmt->fetchColumn() == 0) {
        $db->exec("INSERT INTO `productos` (`nombre`, `descripcion`, `precio_unidad`, `stock`, `es_toxico`, `fecha_registro`) VALUES
            ('Detergente Multiusos', 'Detergente líquido concentrado para todo tipo de superficies', 4.50, 150, 0, '2026-06-10'),
            ('Desinfectante de Cloro', 'Desinfectante fuerte a base de cloro activo', 2.80, 80, 1, '2026-06-12'),
            ('Limpia Cristales Premium', 'Spray para limpieza de vidrios sin dejar marcas', 3.20, 200, 0, '2026-06-14')");
        echo "Datos de prueba insertados en `productos`.\n";
    }

    // 9. Insertar datos de prueba en `pedidos` si está vacía
    $stmt = $db->query("SELECT COUNT(*) FROM `pedidos`");
    if ($stmt->fetchColumn() == 0) {
        $db->exec("INSERT INTO `pedidos` (`producto`, `cantidad`, `precio_total`, `fecha_pedido`) VALUES
            ('Detergente Multiusos', 20, 90.00, '2026-06-11'),
            ('Desinfectante de Cloro', 10, 28.00, '2026-06-13')");
        echo "Datos de prueba insertados en `pedidos`.\n";
    }

    // 10. Insertar datos de prueba en `centros_trabajo` si está vacía
    $stmt = $db->query("SELECT COUNT(*) FROM `centros_trabajo`");
    if ($stmt->fetchColumn() == 0) {
        $db->exec("INSERT INTO `centros_trabajo` (`nombre`, `direccion`, `telefono`) VALUES
            ('Sede Central Madrid', 'Paseo de la Castellana 123, Madrid', '912345678'),
            ('Sucursal Barcelona', 'Avinguda Diagonal 456, Barcelona', '934567890')");
        echo "Datos de prueba insertados en `centros_trabajo`.\n";
    }

    echo "\nBase de datos inicializada correctamente.";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
