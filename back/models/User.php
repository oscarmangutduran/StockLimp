<?php
/**
 * Modelo de Usuarios
 */
class User {
    private $db;
    private $table = "usuarios";

    public function __construct($conn) {
        $this->db = $conn;
    }

    /**
     * Buscar un usuario por su email
     */
    public function findByEmail($email) {
        $sql = "SELECT * FROM {$this->table} WHERE email = :email LIMIT 1";
        try {
            $query = $this->db->prepare($sql);
            $query->bindParam(':email', $email);
            $query->execute();
            return $query->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return null;
        }
    }
}
