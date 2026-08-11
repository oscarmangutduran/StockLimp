<?php
$prodPdo = new PDO("mysql:host=mysql-39007dc0-stocklimp.d.aivencloud.com;port=11323;dbname=defaultdb", "avnadmin", "AVNS_hPzV7tSCverngGyk10S", [
    PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
]);

$prodPdo->exec("UPDATE users SET rol = 'super_admin' WHERE email = 'oscar@stocklimp.com'");
$prodPdo->exec("UPDATE users SET rol = 'admin' WHERE email = 'admin@stocklimp.com'");
$prodPdo->exec("UPDATE users SET rol = 'repartidor' WHERE email = 'evaristo@stocklimp.com'");

echo "Updated roles correctly\n";
