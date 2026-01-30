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
            // Limpieza de datos
            foreach ($data as $key => $value) {
                if ($value === "") $data[$key] = null;
                // Conversión de booleano para SQL
                if ($key === 'es_toxico') {
                    $data[$key] = ($value === 'SÍ' || $value === '1' || $value === 1) ? 1 : 0;
                }
            }

            if ($action === 'create') $this->create($resource, $data);
            if ($action === 'update') $this->update($resource, $data);
            if ($action === 'delete') $this->delete($resource, $data);
        }
    }

    private function create($table, $data) {
        $columns = implode(", ", array_keys($data));
        $placeholders = ":" . implode(", :", array_keys($data));
        $stmt = $this->db->prepare("INSERT INTO $table ($columns) VALUES ($placeholders)");
        echo json_encode(["success" => $stmt->execute($data)]);
    }

    private function update($table, $data) {
        $idCol = array_key_first($data);
        $idVal = $data[$idCol];
        unset($data[$idCol]);
        $sets = "";
        foreach ($data as $key => $val) { $sets .= "$key = :$key, "; }
        $sets = rtrim($sets, ", ");
        $stmt = $this->db->prepare("UPDATE $table SET $sets WHERE $idCol = :pid");
        $data['pid'] = $idVal;
        echo json_encode(["success" => $stmt->execute($data)]);
    }

    private function delete($table, $data) {
        $idCol = $data['column'];
        $stmt = $this->db->prepare("DELETE FROM $table WHERE $idCol = :id");
        echo json_encode(["success" => $stmt->execute(['id' => $data['id']])]);
    }
}
?>