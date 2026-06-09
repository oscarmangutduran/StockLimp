<?php
require_once 'models/Order.php';

class OrderController {
    private $orderModel;

    public function __construct($db) {
        $this->orderModel = new Order($db);
    }

    public function handleRequest($method, $action, $data) {
        if ($method === 'GET') {
            echo json_encode($this->orderModel->readAllOrders());
            exit;
        }

        if ($method === 'POST') {
            switch ($action) {
                case 'create_pedido_multiple':
                    $id_user = $data['id_user'] ?? null;
                    $productos = $data['productos'] ?? [];
                    $res = $this->orderModel->createMultipleOrder($id_user, $productos);
                    echo json_encode(["success" => $res]);
                    break;

                case 'update':
                    $res = $this->orderModel->updateOrder($data);
                    echo json_encode(["success" => $res]);
                    break;
                    
                default:
                    http_response_code(400);
                    echo json_encode(["success" => false, "message" => "Acción de pedido inválida"]);
                    break;
            }
            exit;
        }
    }
}