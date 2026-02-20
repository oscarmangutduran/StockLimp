<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

include_once './config/Database.php';
include_once './controllers/UserController.php';

$database = new Database();
$db = $database->getConnection();
$resource = $_GET['resource'] ?? '';

// LÓGICA DE LOGIN (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $resource === 'login') {
    $data = json_decode(file_get_contents("php://input"), true);
    $userCtrl = new UserController($db);
    echo json_encode($userCtrl->login($data['user'], $data['pass']));
    exit;
}

// LÓGICA DE CONSULTAS (GET)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    switch ($resource) {
        case 'productos':
        case 'pedidos':
        case 'centros_trabajo':
            $stmt = $db->prepare("SELECT * FROM " . strtoupper($resource));
            $stmt->execute();
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'componentes':
            $id = $_GET['id_producto'] ?? 0;
            $stmt = $db->prepare("SELECT * FROM PRODUCTO_COMPONENTES WHERE id_producto = ?");
            $stmt->execute([$id]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;
    }
}
?>