<?php
class ProductController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function getAll($table) {
        $result = $this->db->query("SELECT * FROM $table");
        if ($result) {
            echo json_encode($result->fetch_all(MYSQLI_ASSOC));
        } else {
            echo json_encode([]);
        }
    }

    public function getComponents($id) {
        if (!$id) { echo json_encode([]); return; }
        // Según tu captura, la tabla es 'producto_componentes'
        $sql = "SELECT * FROM producto_componentes WHERE id_producto = " . intval($id);
        $result = $this->db->query($sql);
        echo json_encode($result ? $result->fetch_all(MYSQLI_ASSOC) : []);
    }

    public function handleAction($table, $action, $data) {
        if ($action === 'create') {
            $keys = implode(", ", array_keys($data));
            $values = "'" . implode("', '", array_values($data)) . "'";
            $sql = "INSERT INTO $table ($keys) VALUES ($values)";
        } 
        elseif ($action === 'update') {
            $idKey = array_keys($data)[0]; 
            $idVal = $data[$idKey];
            unset($data[$idKey]);
            $pairs = [];
            foreach ($data as $k => $v) { $pairs[] = "$k = '$v'"; }
            $sql = "UPDATE $table SET " . implode(", ", $pairs) . " WHERE $idKey = '$idVal'";
        } 
        elseif ($action === 'delete') {
            $id = $data['id'];
            $col = $data['column'];
            $sql = "DELETE FROM $table WHERE $col = '$id'";
        }

        if ($this->db->query($sql)) {
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "message" => $this->db->error]);
        }
    }
}
?>