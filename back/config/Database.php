<?php
class Database {
    private $host = "localhost";
    private $db_name = "stocklimp";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name;
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("SET NAMES utf8");
        } catch(PDOException $exception) {
            http_response_code(500);
            echo json_encode([]);
            exit();
        }
        return $this->conn;
    }
}
?>
