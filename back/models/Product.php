<?php
/**
 * Modelo de Productos
 */
class Product {
    private $db;
    private $table = "productos";

    public function __construct($conn) {
        $this->db = $conn;
    }

    /**
     * Obtener listado completo
     */
    public function read() {
        $sql = "SELECT * FROM {$this->table} ORDER BY nombre ASC";
        
        try {
            $query = $this->db->prepare($sql);
            $query->execute();
            return $query;
        } catch (PDOException $e) {
            return null;
        }
    }
}