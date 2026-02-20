<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

include_once './config/Database.php';
include_once './controllers/ProductController.php';

$database = new Database();
$db = $database->getConnection();
$productController = new ProductController($db);

$resource = $_GET['resource'] ?? '';

if ($resource === 'productos') {
    echo json_encode($productController->listProducts());
} elseif ($resource === 'componentes') {
    $id = $_GET['id_producto'] ?? 0;
    echo json_encode($productController->listComponents($id));
}
?>