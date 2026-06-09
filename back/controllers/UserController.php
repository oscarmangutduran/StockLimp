<?php
require_once 'models/User.php';

class UserController {
    private $userModel;

    public function __construct($db) {
        $this->userModel = new User($db);
    }

    public function handleRequest($method, $action, $data) {
        if ($method === 'POST' && $action === 'login') {
            
            // Absorción flexible de variables del body para evitar desmapeos
            $email = $data['email'] ?? $data['user'] ?? $data['username'] ?? null;
            $password = $data['password'] ?? $data['pass'] ?? null;

            if (empty($email) || empty($password)) {
                http_response_code(400);
                echo json_encode([
                    "success" => false, 
                    "message" => "Faltan datos obligatorios para el inicio de sesión."
                ]);
                exit;
            }

            // Invocar la lógica de verificación del modelo
            $user = $this->userModel->login($email, $password);

            if ($user) {
                echo json_encode(["success" => true, "user" => $user]);
            } else {
                echo json_encode([
                    "success" => false, 
                    "message" => "Credenciales incorrectas."
                ]);
            }
            exit;
        }
        
        http_response_code(405);
        echo json_encode(["success" => false, "message" => "Método o acción no permitida para el recurso usuarios."]);
    }
}