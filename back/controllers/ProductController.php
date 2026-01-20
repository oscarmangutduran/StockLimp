<?php
require_once 'models/Product.php';

class ProductController {
    private $model;

    public function __construct($db) {
        $this->model = new Product($db);
    }

    public function handleRequest($method, $table) {
        if ($method !== 'GET') {
            http_response_code(405);
            return;
        }

        $res = $this->model->readAny($table);
        if ($res) {
            echo json_encode($res->fetchAll(PDO::FETCH_ASSOC));
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Error al obtener registros de $table"]);
        }
    }
}