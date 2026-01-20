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

$api = new ProductController($db);

switch ($resource) {
    case 'login':
        // Capturamos el POST para el login
        $api->login($_POST);
        break;

    case 'productos':
    case 'pedidos':
    case 'detalle_pedido':
    case 'centros_trabajo':
        $api->handleRequest($method, $resource);
        break;

    default:
        http_response_code(404);
        echo json_encode(["error" => "Recurso no encontrado"]);
        break;
}