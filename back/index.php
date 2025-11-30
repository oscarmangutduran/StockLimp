<?php
// back/index.php

// ----------------------------------------------------
// 1. CABECERAS CORS (ESENCIAL PARA COMUNICACIÓN REACT-PHP)
// ----------------------------------------------------
header("Access-Control-Allow-Origin: *"); // Permite cualquier origen (para desarrollo)
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Responde a peticiones OPTIONS (pre-vuelo CORS)
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
// 3. ENRUTAMIENTO (Routing Básico)
// ----------------------------------------------------

$request_method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];
$base_path = '/back/'; // Ruta base de la carpeta en XAMPP

// Quitar la ruta base para obtener el recurso real (ej: 'productos')
$uri_without_base = str_replace($base_path, '', $request_uri);
$uri_parts = explode('/', trim($uri_without_base, '/'));
$resource = $uri_parts[0]; // El primer segmento es el recurso ('productos', 'users', etc.)

// Manejo de la entidad 'productos' (Sprint 1)
if ($resource === 'productos') {
    $controller = new ProductController($db);
    $controller->handleRequest($request_method);
} 
// Futuros recursos (Sprint 2): else if ($resource === 'users') { ... }
else {
    // Si la ruta no existe
    http_response_code(404);
    echo json_encode(["message" => "Recurso no encontrado. La API soporta: /productos."]);
}

?>
