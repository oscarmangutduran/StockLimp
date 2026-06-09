<?php
require_once 'models/Product.php';

class ProductController {
    private $productModel;

    public function __construct($db) {
        $this->productModel = new Product($db);
    }

    public function handleRequest($method, $action, $data) {
        $resource = $_GET['resource'] ?? 'productos';

        if ($method === 'GET') {
            switch ($resource) {
                case 'productos':
                    echo json_encode($this->productModel->readAll());
                    break;
                case 'pedidos':
                    echo json_encode($this->productModel->readAllOrders());
                    break;
                case 'centros_trabajo':
                    echo json_encode($this->productModel->readAllCenters());
                    break;
                default:
                    echo json_encode([]);
                    break;
            }
            exit;
        }

        if ($method === 'POST') {
            switch ($action) {
                case 'create':
                    $success = ($resource === 'productos') 
                        ? $this->productModel->createProduct($data) 
                        : $this->productModel->createCenter($data);
                    echo json_encode(["success" => $success]);
                    break;

                case 'update':
                    if ($resource === 'productos') {
                        $success = $this->productModel->updateProduct($data);
                    } elseif ($resource === 'pedidos') {
                        $success = $this->productModel->updateOrder($data);
                    } else {
                        $success = $this->productModel->updateCenter($data);
                    }
                    echo json_encode(["success" => $success]);
                    break;

                case 'create_pedido_multiple':
                    $success = $this->productModel->createMultipleOrder($data);
                    echo json_encode(["success" => $success]);
                    break;

                case 'delete':
                    $success = $this->productModel->deleteRecord($resource, $data['id'] ?? null, $data['column'] ?? '');
                    echo json_encode(["success" => $success]);
                    break;

                default:
                    echo json_encode(["success" => false, "message" => "Acción POST denegada."]);
                    break;
            }
            exit;
        }
    }
}