<?php
class Product {
    private $conn;
    private $table_name = "productos";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function readAll() {
        $query = "SELECT id_producto, nombre, sku, es_toxico, precio_unidad, stock_actual, fecha_registro FROM " . $this->table_name . " ORDER BY id_producto DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create($data) {
        $query = "INSERT INTO " . $this->table_name . " SET nombre=:nombre, sku=:sku, es_toxico=:es_toxico, precio_unidad=:precio_unidad, stock_actual=:stock_actual";
        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(':nombre', $data['nombre']);
        $stmt->bindParam(':sku', $data['sku']);
        $stmt->bindParam(':es_toxico', $data['es_toxico']);
        $stmt->bindParam(':precio_unidad', $data['precio_unidad']);
        $stmt->bindParam(':stock_actual', $data['stock_actual']);

        return $stmt->execute();
    }

    public function update($data) {
        $query = "UPDATE " . $this->table_name . " SET nombre=:nombre, sku=:sku, es_toxico=:es_toxico, precio_unidad=:precio_unidad, stock_actual=:stock_actual WHERE id_producto=:id_producto";
        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(':id_producto', $data['id_producto']);
        $stmt->bindParam(':nombre', $data['nombre']);
        $stmt->bindParam(':sku', $data['sku']);
        $stmt->bindParam(':es_toxico', $data['es_toxico']);
        $stmt->bindParam(':precio_unidad', $data['precio_unidad']);
        $stmt->bindParam(':stock_actual', $data['stock_actual']);

        return $stmt->execute();
    }

    public function deleteRecord($id, $column) {
        // Ejecución genérica protegida por Prepare Statement
        $query = "DELETE FROM " . $this->table_name . " WHERE " . $column . " = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }
}