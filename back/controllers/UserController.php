<?php
class UserController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function login($email, $password) {
        $query = "SELECT id_user, nombre, email, password_hash FROM USERS WHERE email = :email LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();

        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        // Comparación directa para la demo (en producción usar password_verify)
        if ($user && $password === $user['password_hash']) {
            unset($user['password_hash']);
            return ["success" => true, "user" => $user];
        }

        return ["success" => false, "message" => "Usuario o contraseña incorrectos"];
    }
}
?>