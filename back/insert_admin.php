<?php
$prodPdo = new PDO("mysql:host=mysql-39007dc0-stocklimp.d.aivencloud.com;port=11323;dbname=defaultdb", "avnadmin", "AVNS_hPzV7tSCverngGyk10S", [
    PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
]);

$hash = password_hash("admin123", PASSWORD_BCRYPT);

$stmt = $prodPdo->prepare("INSERT INTO users (id_user, nombre, email, password_hash, rol, estado, solicita_restablecimiento) VALUES (1, 'Oscar', 'oscar@stocklimp.com', ?, 'super administrador', 'activo', 0)");
$stmt->execute([$hash]);

echo "Inserted super admin user successfully\n";
