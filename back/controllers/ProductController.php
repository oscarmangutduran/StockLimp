<?php
include_once '../models/Product.php';

class ProductController {
    private $db;
    private $product;

    public function __construct($db) {
        $this->db = $db;
        $this->product = new Product($db);
    }

    public function listProducts() {
        $stmt = $this->product->read();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function listComponents($id) {
        $stmt = $this->product->getComponents($id);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>