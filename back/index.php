<?php
// Forzar visualización de errores para depuración en desarrollo
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Cabeceras CORS obligatorias para conectar con el Front-end de Vite
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

// Si es una petición de control OPTIONS (Preflight de Axios/Vite), respondemos 200 y salimos de inmediato
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Importar e inicializar la conexión PDO a la Base de Datos
require_once 'config/Database.php';
$database = new Database();
$db = $database->getConnection();

// Capturar parámetros de recurso y acción de la URL (?resource=...&action=...)
$resource = $_GET['resource'] ?? '';
$action = $_GET['action'] ?? '';

// Leer el JSON en crudo enviado en el cuerpo de la petición por Axios
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Aseguramos que $data sea un array, aunque venga vacío
if (!is_array($data)) {
    $data = [];
}

// --- ENRUTADOR PRINCIPAL ---
switch ($resource) {
    case 'usuarios':
        require_once 'controllers/UserController.php';
        $controller = new UserController($db);
        $controller->handleRequest($_SERVER['REQUEST_METHOD'], $action, $data);
        break;

    case 'productos':
        require_once 'controllers/ProductController.php';
        $controller = new ProductController($db);
        $controller->handleRequest($_SERVER['REQUEST_METHOD'], $action, $data);
        break;

    case 'centros_trabajo':
        require_once 'controllers/CenterController.php';
        $controller = new CenterController($db);
        $controller->handleRequest($_SERVER['REQUEST_METHOD'], $action, $data);
        break;

    case 'pedidos':
        require_once 'controllers/OrderController.php';
        $controller = new OrderController($db);
        $controller->handleRequest($_SERVER['REQUEST_METHOD'], $action, $data);
        break;

    default:
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Recurso no encontrado: " . $resource]);
        break;
}