<?php
require_once 'models/User.php';

class UserController {
    private $userModel;

    public function __construct($db) {
        $this->userModel = new User($db);
    }

    public function handleRequest($method, $action, $data) {
        if ($method === 'POST' && $action === 'login') {
            
            // Blindaje de claves: Buscamos cualquier variante que envíe React
            $email = $data['email'] ?? $data['user'] ?? $data['username'] ?? '';
            $password = $data['password'] ?? $data['pass'] ?? '';

            // Si las variables llegan vacías, escribimos un log interno en Apache
            if (empty($email) || empty($password)) {
                error_log("UserController Error: Las variables de Login llegaron vacías al controlador.");
            }

            // Llamamos al modelo híbrido
            $user = $this->userModel->login($email, $password);

            if ($user) {
                echo json_encode(["success" => true, "user" => $user]);
            } else {
                echo json_encode(["success" => false, "message" => "El usuario o la clave no coinciden."]);
            }
            exit;
        }
    }
}