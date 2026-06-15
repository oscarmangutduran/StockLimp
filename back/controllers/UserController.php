<?php
/**
 * Controlador de Usuarios
 */
require_once 'models/User.php';

class UserController {
    private $model;

    public function __construct($db) {
        $this->model = new User($db);
    }

    public function handleRequest($method) {
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(["success" => false, "message" => "Method not allowed"]);
            return;
        }

        $this->login();
    }

    private function login() {
        // Obtener el cuerpo de la petición
        $input = json_decode(file_get_contents('php://input'), true);

        // Aceptar campos de Login.js (email/password) y de ProductManagement.js (user/pass)
        $email = $input['email'] ?? $input['user'] ?? null;
        $password = $input['password'] ?? $input['pass'] ?? null;

        if (!$email || !$password) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Faltan credenciales."]);
            return;
        }

        $user = $this->model->findByEmail($email);

        if ($user) {
            // Verificar contraseña (soporta texto plano para pruebas e hash de PHP)
            $isValid = false;
            if (password_verify($password, $user['password'])) {
                $isValid = true;
            } else if ($password === $user['password']) {
                $isValid = true;
            }

            if ($isValid) {
                // Eliminar la contraseña del objeto de retorno por seguridad
                unset($user['password']);

                $response = [
                    "success" => true,
                    "id_user" => $user['id_user'],
                    "nombre" => $user['nombre'],
                    "email" => $user['email'],
                    "user" => $user // Compatible con ProductManagement.js
                ];

                http_response_code(200);
                echo json_encode($response);
                return;
            }
        }

        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Email o contraseña incorrectos."]);
    }
}
