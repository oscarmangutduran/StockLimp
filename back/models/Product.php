<?php
class Product {
    private $conn;
    private $table_name = "PRODUCTOS";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function read() {
        $query = "SELECT * FROM " . $this->table_name;
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function getComponents($id) {
        $query = "SELECT * FROM PRODUCTO_COMPONENTES WHERE id_producto = ?";
        $stmt = $this->conn->prepare($query);
        $stmt->execute([$id]);
        return $stmt;
    }
}
?>