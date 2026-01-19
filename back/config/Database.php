<?php
/**
 * Database Config
 * Conexión PDO para el sistema StockLimp
 */
class Database {
    private $host = "localhost";
    private $db   = "stocklimp";
    private $user = "root";
    private $pass = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $dsn = "mysql:host={$this->host};dbname={$this->db};charset=utf8";
            $this->conn = new PDO($dsn, $this->user, $this->pass);
            
            // Reporte de errores para desarrollo
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        } catch(PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "DB_CONN_FAIL", "details" => $e->getMessage()]);
            die();
        }

        return $this->conn;
    }
}