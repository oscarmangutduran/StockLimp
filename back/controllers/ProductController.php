<?php
class ProductController {
    private $db;
    public function __construct($db) { $this->db = $db; }

    public function handleRequest($method, $resource) {
        if ($method === 'GET') {
            $stmt = $this->db->prepare("SELECT * FROM $resource");
            $stmt->execute();
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        }
    }
}