<?php
class ProductController {
    private $db;
    public function __construct($db) { $this->db = $db; }

    public function handleRequest($method, $resource) {
        $action = $_GET['action'] ?? 'read';
        $data = json_decode(file_get_contents("php://input"), true);

        if ($method === 'GET') {
            $stmt = $this->db->prepare("SELECT * FROM $resource");
            $stmt->execute();
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } else if ($method === 'POST') {
            switch ($action) {
                case 'create': $this->create($resource, $data); break;
                case 'update': $this->update($resource, $data); break;
                case 'delete': $this->delete($resource, $data); break;
            }
        }
    }

    private function create($table, $data) {
        // Filtramos campos vacíos (como el ID autoincremental)
        $data = array_filter($data, function($v) { return $v !== ""; });
        $columns = implode(", ", array_keys($data));
        $placeholders = ":" . implode(", :", array_keys($data));
        
        $stmt = $this->db->prepare("INSERT INTO $table ($columns) VALUES ($placeholders)");
        echo json_encode(["success" => $stmt->execute($data)]);
    }

    private function update($table, $data) {
        $idCol = array_key_first($data); // Detecta id_producto, id_centro, etc.
        $idVal = $data[$idCol];
        unset($data[$idCol]);

        $sets = "";
        foreach ($data as $key => $val) { $sets .= "$key = :$key, "; }
        $sets = rtrim($sets, ", ");

        $sql = "UPDATE $table SET $sets WHERE $idCol = :primary_id";
        $data['primary_id'] = $idVal;
        
        $stmt = $this->db->prepare($sql);
        echo json_encode(["success" => $stmt->execute($data)]);
    }

    private function delete($table, $data) {
        $idCol = $data['column'];
        $stmt = $this->db->prepare("DELETE FROM $table WHERE $idCol = :id");
        echo json_encode(["success" => $stmt->execute(['id' => $data['id']])]);
    }
}