<?php
class Database {
    private $host = "localhost";
    private $db_name = "stocklimp"; // Verifica que este nombre coincida con phpMyAdmin
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new mysqli($this->host, $this->username, $this->password, $this->db_name);
            $this->conn->set_charset("utf8");
        } catch(Exception $e) {
            echo json_encode(["success" => false, "message" => "Error de conexión: " . $e->getMessage()]);
            exit;
        }
        return $this->conn;
    }
}
?>