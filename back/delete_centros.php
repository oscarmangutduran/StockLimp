<?php
try {
    $pdo = new PDO('mysql:host=localhost;port=3306;dbname=stocklimp', 'root', '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    // 1. Exportar copia de seguridad de los centros existentes antes de borrar
    $centros = $pdo->query('SELECT * FROM centros_trabajo')->fetchAll(PDO::FETCH_ASSOC);
    $backupPath = __DIR__ . '/centros_backup_' . date('Ymd_His') . '.json';
    file_put_contents($backupPath, json_encode($centros, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    echo "Copia de seguridad guardada en: " . basename($backupPath) . " (" . count($centros) . " centros)\n";

    // 2. Desactivar temporalmente revisión de claves foráneas
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

    // 3. Limpiar referencias en centro_user
    $stmt1 = $pdo->exec("DELETE FROM centro_user");
    echo "Filas eliminadas en centro_user: $stmt1\n";

    // 4. Poner a NULL id_centro en users
    $stmt2 = $pdo->exec("UPDATE users SET id_centro = NULL");
    echo "Usuarios desvinculados de centros: $stmt2\n";

    // 5. Permitir NULL en pedidos.id_centro y desvincularlos
    $pdo->exec("ALTER TABLE pedidos MODIFY id_centro INT(10) UNSIGNED NULL");
    $stmt3 = $pdo->exec("UPDATE pedidos SET id_centro = NULL");
    echo "Pedidos desvinculados de centros: $stmt3\n";

    // 6. Eliminar todos los centros de trabajo
    $stmt4 = $pdo->exec("DELETE FROM centros_trabajo");
    echo "Centros eliminados: $stmt4\n";

    // 7. Reiniciar el AUTO_INCREMENT
    $pdo->exec("ALTER TABLE centros_trabajo AUTO_INCREMENT = 1");
    echo "Auto-increment de centros_trabajo reiniciado a 1.\n";

    // 8. Reactivar revisión de claves foráneas
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

    // Verificación
    $totalRestante = $pdo->query("SELECT COUNT(*) FROM centros_trabajo")->fetchColumn();
    echo "Centros actuales en la base de datos: $totalRestante\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
