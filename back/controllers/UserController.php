<?php
class UserController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function login($data) {
        $user_recibido = $data['user'] ?? ''; // Puede ser nombre o email
        $pass_recibida = $data['pass'] ?? '';

        $query = "SELECT * FROM USERS WHERE email = :user OR nombre = :user LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user', $user_recibido);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Permite contraseña en texto plano o encriptada con hash
            if ($pass_recibida === $row['password_hash'] || password_verify($pass_recibida, $row['password_hash'])) {
                echo json_encode([
                    "success" => true,
                    "user" => [
                        "nombre" => $row['nombre'],
                        "email" => $row['email'],
                        "rol" => isset($row['rol']) ? $row['rol'] : 'usuario'
                    ]
                ]);
            } else {
                echo json_encode([
                    "success" => false, 
                    "message" => "Credenciales incorrectas"
                ]);
            }
        } else {
            echo json_encode([
                "success" => false, 
                "message" => "Credenciales incorrectas"
            ]);
        }
    }
}
?>