<?php
// back/config/Database.php

class Database {
    // Ajustes de conexión para XAMPP
    private $host = "localhost";
    private $db_name = "stocklimp"; // ¡Asegúrate de que coincida con tu BD!
    private $username = "root";
    private $password = ""; // En XAMPP por defecto va vacía
    public $conn;

    /**
     * Obtiene la conexión a la base de datos (PDO).
     * @return PDO|null
     */
    public function getConnection() {
        $this->conn = null;

        try {
            // Charset agregado en el DSN (correcto para MySQL)
            $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset=utf8";

            $this->conn = new PDO($dsn, $this->username, $this->password);

            // Configurar errores como excepciones (muy importante)
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        } catch (PDOException $exception) {
            http_response_code(500);
            echo json_encode([
                "message" => "Error al conectar con la base de datos.",
                "error"   => $exception->getMessage()
            ]);
            exit();
        }

        return $this->conn;
    }
}
?>
