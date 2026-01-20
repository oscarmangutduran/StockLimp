<?php
require_once 'models/Product.php';

class ProductController {
    private $db;
    private $model;

    public function __construct($db) {
        $this->db = $db;
        $this->model = new Product($db);
    }

    public function login($data) {
        // Limpiamos cualquier salida previa para asegurar un JSON puro
        if (ob_get_length()) ob_clean();
        header('Content-Type: application/json; charset=utf-8');

        $email = $data['email'] ?? '';
        $pass  = $data['password'] ?? '';

        try {
            // Consulta usando tus nombres de columna reales: id_user y password_hash
            $sql = "SELECT id_user, nombre FROM users WHERE email = ? AND password_hash = ? LIMIT 1";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([$email, $pass]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                echo json_encode([
                    "success" => true,
                    "id_user" => $user['id_user'],
                    "nombre" => $user['nombre']
                ]);
            } else {
                http_response_code(401);
                echo json_encode(["success" => false, "message" => "Credenciales incorrectas"]);
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Error de servidor"]);
        }
        exit;
    }

    public function handleRequest($method, $table) {
        $res = $this->model->readAny($table);
        echo json_encode($res ? $res->fetchAll(PDO::FETCH_ASSOC) : []);
    }
}