<?php
/**
 * API Entry Point - StockLimp
 */

if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

header("Content-Type: application/json; charset=UTF-8");

require_once 'config/Database.php';
require_once 'controllers/ProductController.php';

$db = (new Database())->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$resource = $_GET['resource'] ?? null;

// Lista blanca: Todas excepto 'users'
$allowed = ['productos', 'pedidos', 'detalle_pedido', 'centros_trabajo'];

if (in_array($resource, $allowed)) {
    $api = new ProductController($db);
    $api->handleRequest($method, $resource);
} else {
    http_response_code(403); // Prohibido
    echo json_encode(["error" => "Acceso denegado a este recurso"]);
}