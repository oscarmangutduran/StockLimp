<?php
class Center {
    private $conn;
    private $table_name = "centros_trabajo";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function readAllCenters() {
        $query = "SELECT id_centro, nombre, direccion, ciudad, fecha_registro FROM " . $this->table_name . " ORDER BY id_centro DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createCenter($data) {
        $query = "INSERT INTO " . $this->table_name . " SET nombre=:nombre, direccion=:direccion, ciudad=:ciudad";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':nombre', $data['nombre']);
        $stmt->bindParam(':direccion', $data['direccion']);
        $stmt->bindParam(':ciudad', $data['ciudad']);
        return $stmt->execute();
    }

    public function updateCenter($data) {
        $query = "UPDATE " . $this->table_name . " SET nombre=:nombre, direccion=:direccion, ciudad=:ciudad WHERE id_centro=:id_centro";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_centro', $data['id_centro']);
        $stmt->bindParam(':nombre', $data['nombre']);
        $stmt->bindParam(':direccion', $data['direccion']);
        $stmt->bindParam(':ciudad', $data['ciudad']);
        return $stmt->execute();
    }

    public function deleteRecord($id, $column) {
        $query = "DELETE FROM " . $this->table_name . " WHERE " . $column . " = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $id);
        return $stmt->execute();
    }
}