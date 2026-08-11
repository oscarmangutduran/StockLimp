<?php
$pdo = new PDO("mysql:host=mysql-39007dc0-stocklimp.d.aivencloud.com;port=11323;dbname=defaultdb", "avnadmin", "AVNS_hPzV7tSCverngGyk10S", [
    PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
]);
$stmt = $pdo->query("SHOW TABLES");
$tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
print_r($tables);
