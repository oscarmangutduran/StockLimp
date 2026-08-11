<?php
$localPdo = new PDO("mysql:host=localhost;port=3306;dbname=stocklimp", "root", "");
$stmt = $localPdo->query("SELECT * FROM users");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

$prodPdo = new PDO("mysql:host=mysql-39007dc0-stocklimp.d.aivencloud.com;port=11323;dbname=defaultdb", "avnadmin", "AVNS_hPzV7tSCverngGyk10S", [
    PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false,
]);

foreach ($users as $user) {
    $keys = array_keys($user);
    $values = array_values($user);
    $placeholders = implode(",", array_fill(0, count($values), "?"));
    $sql = "INSERT IGNORE INTO users (" . implode(",", $keys) . ") VALUES ($placeholders)";
    $stmt = $prodPdo->prepare($sql);
    $stmt->execute($values);
}
echo "Copied " . count($users) . " users to production.\n";
