<?php
$prodPdo = new PDO("mysql:host=mysql-39007dc0-stocklimp.d.aivencloud.com;port=11323;dbname=defaultdb", "avnadmin", "AVNS_hPzV7tSCverngGyk10S", [
    PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
]);

$prodPdo->exec("ALTER TABLE productos ADD COLUMN sku VARCHAR(50) UNIQUE DEFAULT NULL");
$prodPdo->exec("ALTER TABLE productos ADD COLUMN precio_unidad DECIMAL(10,2) NOT NULL DEFAULT 0.00");
$prodPdo->exec("ALTER TABLE productos ADD COLUMN stock_actual DECIMAL(10,2) DEFAULT 0.00");
$prodPdo->exec("ALTER TABLE productos ADD COLUMN fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP");

echo "Altered productos table successfully\n";
