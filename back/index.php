<?php
/**
 * API Entry Point - StockLimp
 * Manejo de rutas y configuración de cabeceras
 */

// Configuración de CORS
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Access-Control-Max-Age: 3600");
}

// Responder rápido a peticiones de pre-vuelo (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header("Content-Type: application/json; charset=UTF-8");

// Carga de dependencias
require_once 'config/Database.php';
require_once 'controllers/ProductController.php';

// Conexión principal
$db = (new Database())->getConnection();

// Captura de parámetros
$method = $_SERVER['REQUEST_METHOD'];
$resource = $_GET['resource'] ?? null;

// Routing de la API
switch ($resource) {
    case 'productos':
        $api = new ProductController($db);
        $api->handleRequest($method);
        break;

    default:
        http_response_code(404);
        echo json_encode(["error" => "Resource not found"]);
        break;
}