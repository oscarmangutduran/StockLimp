<?php
// Forzar visualización de errores para depuración en la defensa
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Cabeceras CORS obligatorias para conectar con el frontend de React
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Importar e instanciar la conexión PDO
require_once 'config/Database.php';
$database = new Database();
$db = $database->getConnection();

// Capturar parámetros url descriptivos
$resource = $_GET['resource'] ?? '';
$action = $_GET['action'] ?? '';

// Leer flujo de datos de Axios
$json = file_get_contents('php://input');
$data = json_decode($json, true) ?? [];

// Forzar mapeo de payload JSON a minúsculas para consistencia de datos
if (is_array($data)) {
    $data = array_change_key_case($data, CASE_LOWER);
}

// --- ENRUTADOR DEL PATRÓN MVC ---
switch ($resource) {
    case 'productos':
    case 'pedidos':
    case 'centros_trabajo':
        require_once 'controllers/ProductController.php';
        $controller = new ProductController($db);
        $controller->handleRequest($_SERVER['REQUEST_METHOD'], $action, $data);
        break;

    case 'usuarios':
        require_once 'controllers/UserController.php';
        $controller = new UserController($db);
        $controller->handleRequest($_SERVER['REQUEST_METHOD'], $action, $data);
        break;

    default:
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Recurso no centralizado: " . $resource]);
        break;
}