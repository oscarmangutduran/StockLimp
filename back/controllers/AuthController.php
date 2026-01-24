<?php
class AuthController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function login($username, $password) {
        try {
            // Buscamos al usuario por su nombre o email
            $stmt = $this->db->prepare("SELECT * FROM usuarios WHERE nombre_usuario = :user LIMIT 1");
            $stmt->execute(['user' => $username]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user && $password === $user['password']) { 
                // Nota: En producción usarías password_verify(), aquí lo hacemos simple para tu DB actual
                echo json_encode([
                    "success" => true, 
                    "user" => [
                        "id" => $user['id_usuario'],
                        "nombre" => $user['nombre_usuario']
                    ]
                ]);
            } else {
                echo json_encode(["success" => false, "message" => "Credenciales incorrectas"]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }
    }
}