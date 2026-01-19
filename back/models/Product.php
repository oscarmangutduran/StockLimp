<?php
class Product {
    private $db;

    public function __construct($conn) {
        $this->db = $conn;
    }

    // Consulta dinámica para cualquier tabla
    public function readAny($table) {
        $sql = "SELECT * FROM " . $table;
        
        try {
            $query = $this->db->prepare($sql);
            $query->execute();
            return $query;
        } catch (PDOException $e) {
            return null;
        }
    }
}