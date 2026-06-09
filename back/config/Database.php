<?php
class Database {
    private $host = "localhost";
    private $db_name = "stocklimp"; // Coincide exactamente con el volcado SQL
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8",
                $this->username,
                $this->password
            );
            // Configurar PDO para lanzar excepciones en caso de errores en las sentencias SQL
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        } catch(PDOException $exception) {
            echo json_encode(["success" => false, "message" => "Error en la conexión a la base de datos: " . $exception->getMessage()]);
            exit;
        }
        return $this->conn;
    }
}