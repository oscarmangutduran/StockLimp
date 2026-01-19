<?php
require_once 'models/Product.php';

class ProductController {
    private $model;

    public function __construct($db) {
        $this->model = new Product($db);
    }

    public function handleRequest($method, $tabla) {
        if ($method === 'GET') {
            $this->fetchData($tabla);
        } else {
            http_response_code(405);
            echo json_encode(["error" => "Método no permitido"]);
        }
    }

    private function fetchData($tabla) {
        $stmt = $this->model->readAny($tabla);
        
        if ($stmt) {
            $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Ajuste manual para booleanos (opcional)
            foreach ($data as &$row) {
                if (isset($row['es_toxico'])) {
                    $row['es_toxico'] = (bool)$row['es_toxico'];
                }
            }
            
            echo json_encode($data);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Fallo al leer la tabla $tabla"]);
        }
    }
}