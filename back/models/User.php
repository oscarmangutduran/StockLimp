<?php
class User {
    private $conn;
    private $table_name = "usuarios";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function login($email, $password) {
        $email = trim($email);
        $password = trim($password);

        $query = "SELECT id_user, nombre, email, password, rol FROM " . $this->table_name . " WHERE email = :email LIMIT 0,1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Sistema híbrido: Texto plano OR hash encriptado de PHP
            if ($password === $row['password'] || password_verify($password, $row['password'])) {
                return [
                    "id_user" => $row['id_user'],
                    "nombre" => $row['nombre'],
                    "email" => $row['email'],
                    "rol" => $row['rol']
                ];
            }
        }
        return false;
    }
}