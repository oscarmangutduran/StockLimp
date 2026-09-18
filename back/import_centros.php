<?php
try {
    $pdo = new PDO('mysql:host=localhost;port=3306;dbname=stocklimp', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // Asegurar que nombre_centro y direccion puedan almacenar textos largos sin truncar
    $pdo->exec("ALTER TABLE centros_trabajo MODIFY nombre_centro TEXT NOT NULL");
    $pdo->exec("ALTER TABLE centros_trabajo MODIFY direccion TEXT NULL");

    $raw = file_get_contents(__DIR__ . '/raw_centros.json');
    $centros = json_decode($raw, true);

    if (!$centros) {
        die("Error decodificando JSON: " . json_last_error_msg() . "\n");
    }

    $stmt = $pdo->prepare("
        INSERT INTO centros_trabajo (id_centro, nombre_centro, direccion, ciudad, fecha_registro)
        VALUES (:id_centro, :nombre_centro, :direccion, :ciudad, :fecha_registro)
        ON DUPLICATE KEY UPDATE
            nombre_centro = VALUES(nombre_centro),
            direccion = VALUES(direccion),
            ciudad = VALUES(ciudad),
            fecha_registro = VALUES(fecha_registro)
    ");

    $count = 0;
    foreach ($centros as $c) {
        $fecha = !empty($c['fecha_registro']) ? $c['fecha_registro'] : date('Y-m-d H:i:s');
        // Si solo viene fecha 'YYYY-MM-DD', le añadimos la hora actual si hace falta o lo dejamos tal cual
        if (strlen($fecha) === 10) {
            $fecha .= ' 00:00:00';
        }

        $stmt->execute([
            ':id_centro' => $c['id_centro'],
            ':nombre_centro' => $c['nombre'],
            ':direccion' => $c['direccion'] ?? null,
            ':ciudad' => $c['ciudad'] ?? null,
            ':fecha_registro' => $fecha,
        ]);
        $count++;
    }

    echo "¡Éxito! Se han insertado/actualizado $count centros de trabajo correctamente.\n";

    $total = $pdo->query("SELECT COUNT(*) FROM centros_trabajo")->fetchColumn();
    echo "Total actual de centros en base de datos: $total\n";

} catch (Exception $e) {
    echo "Error durante la importación: " . $e->getMessage() . "\n";
}
