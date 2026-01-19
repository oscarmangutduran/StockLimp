<?php
/**
 * Lógica para el recurso Productos
 */
require_once 'models/Product.php';

class ProductController {
    private $model;

    public function __construct($db) {
        $this->model = new Product($db);
    }

    public function handleRequest($method) {
        if ($method !== 'GET') {
            http_response_code(405);
            echo json_encode(["error" => "Method not allowed"]);
            return;
        }

        $this->getAll();
    }

    private function getAll() {
        $res = $this->model->read();
        
        if ($res && $res->rowCount() > 0) {
            $data = [];

            while ($row = $res->fetch()) {
                // Casteo manual de tipos específicos
                $row['es_toxico'] = (bool)$row['es_toxico'];
                $row['precio_unidad'] = (float)$row['precio_unidad'];
                $data[] = $row;
            }

            http_response_code(200);
            echo json_encode($data);
        } else {
            http_response_code(404);
            echo json_encode(["msg" => "No hay registros"]);
        }
    }
}