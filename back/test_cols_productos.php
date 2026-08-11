<?php
$localPdo = new PDO("mysql:host=localhost;port=3306;dbname=stocklimp", "root", "");
$stmt = $localPdo->query("SHOW COLUMNS FROM productos");
$cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($cols);
