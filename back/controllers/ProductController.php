<?php
// back/controllers/ProductController.php

include_once 'models/Product.php';

class ProductController {
private $db;
 private $product;

 public function __construct($db) {
 $this->db = $db;
 $this->product = new Product($db);
 }

 public function handleRequest($method) {
 if ($method === 'GET') {
 $this->readAll();
 } else {
 http_response_code(405); 
 echo json_encode(["message" => "Método no permitido."]);
}
 }

private function readAll() {
 $stmt = $this->product->read();
 $num = $stmt->rowCount();

 if ($num > 0) {
$products_arr = array();

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
 extract($row);
 $product_item = array(
 "id_producto" => $id_producto,
 "nombre" => $nombre,
"es_toxico" => (bool)$es_toxico,
 "precio_unidad" => $precio_unidad,
 "stock_actual" => $stock_actual
 );
 array_push($products_arr, $product_item);
 }

 http_response_code(200);
 echo json_encode($products_arr);
} else {
 http_response_code(404);
 echo json_encode(array("message" => "No se encontraron productos."));
 }
 }
}
?>