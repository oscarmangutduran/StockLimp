<?php
class UserController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function login($data) {
        $email_recibido = $data['user'] ?? ''; // React envía 'user'
        $pass_recibida = $data['pass'] ?? '';  // React envía 'pass'

        // Credenciales que me has proporcionado
        $mi_email = "oscar@stocklimp.com";
        $mi_pass = "admin123";

        if ($email_recibido === $mi_email && $pass_recibida === $mi_pass) {
            echo json_encode([
                "success" => true,
                "user" => [
                    "nombre" => "Oscar Mangut",
                    "email" => $mi_email,
                    "rol" => "Administrador"
                ]
            ]);
        } else {
            echo json_encode([
                "success" => false, 
                "message" => "Credenciales incorrectas"
            ]);
        }
    }
}
?>