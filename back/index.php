<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'config/Database.php';
require_once 'controllers/ProductController.php';
require_once 'controllers/UserController.php';

$database = new Database();
$db = $database->getConnection();

$resource = $_GET['resource'] ?? '';
$action = $_GET['action'] ?? '';
$input = json_decode(file_get_contents("php://input"), true);

switch ($resource) {
    case 'login':
        $controller = new UserController($db);
        $controller->login($input);
        break;

    case 'productos':
    case 'pedidos':
    case 'centros_trabajo':
        $controller = new ProductController($db);
        if ($_SERVER['REQUEST_METHOD'] === 'GET') {
            $controller->getAll($resource);
        } else {
            $controller->handleAction($resource, $action, $input);
        }
        break;

    case 'componentes':
        $controller = new ProductController($db);
        $id = $_GET['id_producto'] ?? null;
        $controller->getComponents($id);
        break;

    default:
        echo json_encode(["message" => "Recurso no encontrado"]);
        break;
}
?>