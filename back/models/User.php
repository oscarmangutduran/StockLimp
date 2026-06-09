<?php
class User {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    /**
     * Sistema de Login Híbrido: Soporta texto plano y hash BCrypt de forma simultánea
     */
    public function login($email, $password) {
        try {
            // Buscamos el registro limpiando el input mediante PDO
            $stmt = $this->conn->prepare("SELECT id_user, nombre, email, password, rol FROM usuarios WHERE email = :email LIMIT 1");
            $stmt->execute([':email' => $email]);
            $user = $stmt->fetch();

            if (!$user) {
                return false; // El email no existe
            }

            $storedPassword = $user['password'];
            $isValid = false;

            // Detectamos si la contraseña almacenada es un hash de BCrypt (empieza por $2y$)
            if (strpos($storedPassword, '$2y$') === 0) {
                if (password_verify($password, $storedPassword)) {
                    $isValid = true;
                }
            } else {
                // Si no es un hash, comparamos en texto plano directamente
                if ($password === $storedPassword) {
                    $isValid = true;
                }
            }

            if ($isValid) {
                unset($user['password']); // Limpieza de seguridad antes de retornar a React
                return $user;
            }

            return false; // Contraseña incorrecta

        } catch (PDOException $e) {
            return false;
        }
    }
}