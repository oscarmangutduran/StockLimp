<?php
$prodPdo = new PDO("mysql:host=mysql-39007dc0-stocklimp.d.aivencloud.com;port=11323;dbname=defaultdb", "avnadmin", "AVNS_hPzV7tSCverngGyk10S", [
    PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
]);

$prodPdo->exec("SET FOREIGN_KEY_CHECKS = 0;");
$stmt = $prodPdo->query("SHOW TABLES");
$tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
foreach ($tables as $table) {
    $prodPdo->exec("DROP TABLE `$table`");
}
$prodPdo->exec("SET FOREIGN_KEY_CHECKS = 1;");
echo "Dropped all tables in Aiven\n";
