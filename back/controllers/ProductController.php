<?php
class ProductController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function handleRequest($method, $resource) {
        $action = $_GET['action'] ?? '';
        $data = json_decode(file_get_contents("php://input"), true);

        if ($method === 'POST') {
            switch ($action) {
                case 'create': $this->createRecord($resource, $data); break;
                case 'update': $this->updateRecord($resource, $data); break;
                case 'delete': $this->deleteRecord($resource, $data); break;
            }
        } else if ($method === 'GET' && !empty($resource)) {
            $this->getAll($resource);
        }
    }

    private function getAll($table) {
        try {
            $stmt = $this->db->prepare("SELECT * FROM $table");
            $stmt->execute();
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (PDOException $e) { echo json_encode([]); }
    }

    private function createRecord($table, $data) {
        $columns = array_keys($data);
        $idColumn = $columns[0];
        unset($data[$idColumn]); // MySQL asigna el ID automáticamente
        
        $cols = implode(", ", array_keys($data));
        $placeholders = ":" . implode(", :", array_keys($data));

        try {
            $sql = "INSERT INTO $table ($cols) VALUES ($placeholders)";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($data);
            echo json_encode(["success" => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }
    }

    private function updateRecord($table, $data) {
        $columns = array_keys($data);
        $idColumn = $columns[0];
        $fields = "";
        foreach ($columns as $col) {
            if ($col !== $idColumn) { $fields .= "$col = :$col, "; }
        }
        $fields = rtrim($fields, ", ");
        try {
            $sql = "UPDATE $table SET $fields WHERE $idColumn = :$idColumn";
            $stmt = $this->db->prepare($sql);
            $stmt->execute($data);
            echo json_encode(["success" => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => $e->getMessage()]);
        }
    }

    private function deleteRecord($table, $data) {
        $idColumn = $data['column'];
        try {
            $sql = "DELETE FROM $table WHERE $idColumn = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['id' => $data['id']]);
            echo json_encode(["success" => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Error al eliminar registro"]);
        }
    }
}