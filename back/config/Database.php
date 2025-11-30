<?php
// back/config/Database.php

class Database {
    // Ajustes de conexión para XAMPP en Windows
    private $host = "localhost";
    private $db_name = "stocklimp"; // ¡VERIFICA ESTE NOMBRE!
    private $username = "root";
    private $password = ""; // Contraseña vacía por defecto en XAMPP
    public $conn;

    /**
     * Obtiene la conexión a la base de datos.
     * @return PDO
     */
    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name;
            
            $this->conn = new PDO($dsn, $this->username, $this->password);
            
            // Configuración crucial para atrapar errores SQL
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Conjunto de caracteres
            $this->conn->exec("set names utf8");

        } catch(PDOException $exception) {
            // Error de conexión, no debería ocurrir si XAMPP está corriendo.
            http_response_code(500);
            echo json_encode(["message" => "Error de conexión a la base de datos: " . $exception->getMessage()]);
            exit();
        }

        return $this->conn;
    }
}
?>