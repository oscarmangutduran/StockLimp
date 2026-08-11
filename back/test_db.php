<?php
$pdo = new PDO("mysql:host=mysql-39007dc0-stocklimp.d.aivencloud.com;port=11323;dbname=defaultdb", "avnadmin", "AVNS_O0w_G_k6YxN4483YxU9", [
    PDO::MYSQL_ATTR_SSL_CA => "C:/xampp/htdocs/StockLimp/back/ca.crt"
]);
$stmt = $pdo->query("SHOW TABLES");
$tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
print_r($tables);
