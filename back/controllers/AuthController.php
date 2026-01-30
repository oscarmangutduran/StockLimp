<?php
class AuthController {
    private $db;
    public function __construct($db) { $this->db = $db; }

    public function login($email, $password) {
        $stmt = $this->db->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Verificación dual: hash o texto plano (para pruebas)
        if ($user && (password_verify($password, $user['password_hash']) || $password === $user['password_hash'])) {
            echo json_encode(["success" => true, "user" => ["nombre" => $user['nombre']]]);
        } else {
            echo json_encode(["success" => false, "message" => "Credenciales incorrectas"]);
        }
    }
}