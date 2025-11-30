<?php
// back/models/Product.php

class Product {
    private $conn;
    private $table_name = "productos";

    // Propiedades mapeadas a la tabla
    public $producto_id;
    public $nombre;
    public $es_toxico;
    public $precio_unidad;
    public $stock_actual;

    public function __construct($db) {
        $this->conn = $db;
    }

    // ----------------------------------------------------
    // CREATE (POST)
    // ----------------------------------------------------
    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET nombre=:nombre, es_toxico=:es_toxico, precio_unidad=:precio_unidad, stock_actual=:stock_actual";

        $stmt = $this->conn->prepare($query);

        // Limpieza de datos y asignación (Binding)
        $this->nombre = htmlspecialchars(strip_tags($this->nombre));
        
        $stmt->bindParam(":nombre", $this->nombre);
        $stmt->bindParam(":es_toxico", $this->es_toxico);
        $stmt->bindParam(":precio_unidad", $this->precio_unidad);
        $stmt->bindParam(":stock_actual", $this->stock_actual);

        return $stmt->execute();
    }

    // ----------------------------------------------------
    // READ ALL (GET)
    // ----------------------------------------------------
    public function read() {
        $query = "SELECT producto_id, nombre, es_toxico, precio_unidad, stock_actual 
                  FROM " . $this->table_name . " 
                  ORDER BY nombre ASC";

        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }
    
    // ----------------------------------------------------
    // UPDATE (PUT)
    // ----------------------------------------------------
    public function update() {
        $query = "UPDATE " . $this->table_name . "
                  SET nombre = :nombre, es_toxico = :es_toxico, precio_unidad = :precio_unidad, stock_actual = :stock_actual
                  WHERE producto_id = :producto_id";

        $stmt = $this->conn->prepare($query);

        // Limpieza de datos y Binding
        $this->nombre = htmlspecialchars(strip_tags($this->nombre));

        $stmt->bindParam(':nombre', $this->nombre);
        $stmt->bindParam(':es_toxico', $this->es_toxico);
        $stmt->bindParam(':precio_unidad', $this->precio_unidad);
        $stmt->bindParam(':stock_actual', $this->stock_actual);
        $stmt->bindParam(':producto_id', $this->producto_id); 

        return $stmt->execute();
    }
    
    // ----------------------------------------------------
    // DELETE (DELETE)
    // ----------------------------------------------------
    public function delete() {
        $query = "DELETE FROM " . $this->table_name . " WHERE producto_id = ?";

        $stmt = $this->conn->prepare($query);

        // Binding del ID
        $this->producto_id = htmlspecialchars(strip_tags($this->producto_id));
        $stmt->bindParam(1, $this->producto_id);

        return $stmt->execute();
    }
}
?>