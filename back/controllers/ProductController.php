<?php
require_once 'models/Product.php';

class ProductController {
    private $db;
    private $model;

    public function __construct($db) {
        $this->db = $db;
        $this->model = new Product($db);
    }

    // Lógica de Autenticación
    public function login($data) {
        $email = $data['email'] ?? '';
        $pass  = $data['password'] ?? '';

        $sql = "SELECT id_usuario, nombre, rol FROM users WHERE email = ? AND password = ? LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([$email, $pass]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            echo json_encode(["success" => true, "user" => $user]);
        } else {
            http_response_code(401);
            echo json_encode(["success" => false, "message" => "Datos incorrectos"]);
        }
    }

    public function handleRequest($method, $table) {
        if ($method !== 'GET') {
            http_response_code(405);
            return;
        }

        $res = $this->model->readAny($table);
        echo json_encode($res ? $res->fetchAll(PDO::FETCH_ASSOC) : []);
    }
}