<?php
include_once 'models/Product.php';

class ProductController {
    private $product;

    public function __construct($db) {
        $this->product = new Product($db);
    }

    public function handleRequest($method) {
        if ($method === 'GET') {
            $this->readAll();
        } else {
            http_response_code(405);
            echo json_encode([]);
        }
    }

    private function readAll() {
        $stmt = $this->product->read();
        $data = [];

        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            extract($row);
            $data[] = [
                "id_producto"   => $id_producto,
                "nombre"        => $nombre,
                "es_toxico"     => (bool)$es_toxico,
                "precio_unidad" => $precio_unidad,
                "stock_actual"  => $stock_actual
            ];
        }

        http_response_code(200);
        echo json_encode($data);
    }
}
?>
