<?php
$prodPdo = new PDO("mysql:host=mysql-39007dc0-stocklimp.d.aivencloud.com;port=11323;dbname=defaultdb", "avnadmin", "AVNS_hPzV7tSCverngGyk10S", [
    PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
]);

$hashAdmin = password_hash("admin123", PASSWORD_BCRYPT);
$stmtAdmin = $prodPdo->prepare("INSERT INTO users (nombre, email, password_hash, rol, estado, solicita_restablecimiento) VALUES ('Admin', 'admin@stocklimp.com', ?, 'administrador', 'activo', 0)");
$stmtAdmin->execute([$hashAdmin]);

$hashRepartidor = password_hash("repartidor123", PASSWORD_BCRYPT);
$stmtRepartidor = $prodPdo->prepare("INSERT INTO users (nombre, email, password_hash, rol, estado, solicita_restablecimiento) VALUES ('Evaristo', 'evaristo@stocklimp.com', ?, 'repartidor', 'activo', 0)");
$stmtRepartidor->execute([$hashRepartidor]);

echo "Inserted admin and repartidor users successfully\n";
