<?php
// back/models/Product.php

class Product {
private $conn;
 private $table_name = "productos";

 public $id_producto;
 public $nombre;
 public $es_toxico;
 public $precio_unidad;
 public $stock_actual;

 public function __construct($db) {
 $this->conn = $db;
 }


 public function read() {
 $query = "SELECT * FROM " . $this->table_name . " ORDER BY nombre ASC";
 $stmt = $this->conn->prepare($query);
$stmt->execute();
 return $stmt;
}
}
?>