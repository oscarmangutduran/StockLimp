<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once 'db.php';
require_once 'controllers/ProductController.php';
require_once 'controllers/AuthController.php';

$resource = $_GET['resource'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

$productCtrl = new ProductController($db);
$authCtrl = new AuthController($db);

if ($resource === 'login') {
    $data = json_decode(file_get_contents("php://input"), true);
    $authCtrl->login($data['user'], $data['pass']);
} else {
    $productCtrl->handleRequest($method, $resource);
}
?>