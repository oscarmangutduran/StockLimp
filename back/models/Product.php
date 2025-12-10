<?php
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
        $stmt = $this->conn->prepare("SELECT * FROM " . $this->table_name . " ORDER BY nombre ASC");
        $stmt->execute();
        return $stmt;
    }
}
?>
