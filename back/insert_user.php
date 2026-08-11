<?php
$prodPdo = new PDO("mysql:host=mysql-39007dc0-stocklimp.d.aivencloud.com;port=11323;dbname=defaultdb", "avnadmin", "AVNS_hPzV7tSCverngGyk10S", [
    PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
]);
$stmt = $prodPdo->query("INSERT IGNORE INTO users (id_user, name, email, password, estado, solicita_restablecimiento) VALUES (1, 'Admin', 'admin@example.com', 'admin', 'activo', 0)");
echo "Inserted user 1";
