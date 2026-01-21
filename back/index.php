<?php
// Permitir que React acceda a los datos
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once 'config/Database.php';
require_once 'controllers/ProductController.php';

$database = new Database();
$db = $database->getConnection();

$resource = $_GET['resource'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

$controller = new ProductController($db);

// Si la petición es para el login o para listar tablas
if ($resource === 'login') {
    $data = json_decode(file_get_contents("php://input"), true);
    $controller->login($data);
} else {
    // Para cualquier otro recurso (productos, pedidos, etc.)
    $controller->handleRequest($method, $resource);
}