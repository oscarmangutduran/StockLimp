<?php
/**
 * API Entry Point - StockLimp (Versión Dinámica)
 */

if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Max-Age: 3600");
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header("Content-Type: application/json; charset=UTF-8");

require_once 'config/Database.php';
require_once 'controllers/ProductController.php';

$db = (new Database())->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$resource = $_GET['resource'] ?? null;

// Lista de tablas permitidas en tu base de datos
$tablas_permitidas = ['productos', 'users', 'pedidos', 'detalle_pedido', 'centros_trabajo'];

if (in_array($resource, $tablas_permitidas)) {
    $api = new ProductController($db);
    // IMPORTANTE: Ahora pasamos el recurso al método handleRequest
    $api->handleRequest($method, $resource);
} else {
    http_response_code(404);
    echo json_encode(["error" => "La tabla '$resource' no existe o no está permitida"]);
}