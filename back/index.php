<?php
// back/index.php
// 🚨 VERIFICACIÓN CRÍTICA: NO DEBE HABER ESPACIOS O CARACTERES ANTES DE ESTA LÍNEA

// ----------------------------------------------------
// 1. CABECERAS CORS (SOLUCIÓN DINÁMICA)
// ----------------------------------------------------

// CRÍTICO: Si el navegador envía el origen (ej: http://localhost:5173), lo usamos.
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
} else {
    // Si falla la detección, usamos el comodín (fallback)
    header("Access-Control-Allow-Origin: *");
}

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ----------------------------------------------------
// 2. INCLUSIÓN DE ARCHIVOS CLAVE
// ----------------------------------------------------
include_once 'config/Database.php';
include_once 'controllers/ProductController.php';

// Inicializar la conexión
$database = new Database();
$db = $database->getConnection();

// ----------------------------------------------------
// 3. ENRUTAMIENTO (Prioriza el parámetro GET)
// ----------------------------------------------------

$request_method = $_SERVER['REQUEST_METHOD'];
$resource = isset($_GET['resource']) ? $_GET['resource'] : null;

// Si estás usando localhost:80, la URL de React será http://localhost/stocklimp/back/index.php?...
// Por lo tanto, el recurso siempre viene de $_GET['resource'].

if ($resource === 'productos') {
    $controller = new ProductController($db);
    $controller->handleRequest($request_method);
} 
else {
    http_response_code(404);
    echo json_encode(["message" => "Recurso no implementado o no encontrado."]);
}

?>