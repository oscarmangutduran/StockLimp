<?php
$host = 'localhost';
$db_name = 'stocklimp'; 
$username = 'root';
$password = ''; 

try {
    $db = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8", $username, $password);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die(json_encode(["success" => false, "message" => $e->getMessage()]));
}
?>