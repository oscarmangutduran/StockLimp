<?php
class ProductController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function handleRequest($method, $resource) {
        if ($method === 'GET' && !empty($resource)) {
            // Consulta dinámica: Selecciona todo de la tabla indicada en el menú
            $query = "SELECT * FROM " . $resource;
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($results);
        }
    }

    public function login($data) {
        // Lógica de login simplificada
        $email = $data['email'] ?? '';
        $pass = $data['password'] ?? '';
        $query = "SELECT id_user, nombre FROM users WHERE email = ? AND password_hash = ? LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$email, $pass]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        echo json_encode($user ? ["success" => true, "user" => $user] : ["success" => false]);
    }
}