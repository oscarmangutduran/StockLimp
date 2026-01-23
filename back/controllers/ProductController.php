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
            if ($action === 'update') {
                $this->updateRecord($resource, $data);
            } else if ($action === 'delete') {
                $this->deleteRecord($resource, $data);
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
        } catch (PDOException $e) {
            echo json_encode([]);
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
        $idValue = $data['id'];
        try {
            $sql = "DELETE FROM $table WHERE $idColumn = :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute(['id' => $idValue]);
            echo json_encode(["success" => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "No se puede eliminar: el registro tiene dependencias."]);
        }
    }
}