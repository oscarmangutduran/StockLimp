<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

include_once './config/Database.php';
include_once './controllers/UserController.php';

$database = new Database();
$db = $database->getConnection();
$resource = $_GET['resource'] ?? '';
$action = $_GET['action'] ?? '';

// --- 1. LÓGICA DE LOGIN ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $resource === 'login') {
    $data = json_decode(file_get_contents("php://input"), true);
    $userCtrl = new UserController($db);
    echo json_encode($userCtrl->login($data['user'] ?? '', $data['pass'] ?? ''));
    exit;
}

// --- 2. LÓGICA DE LECTURA (GET) ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    switch ($resource) {
        case 'productos':
        case 'pedidos':
        case 'centros_trabajo':
            $stmt = $db->prepare("SELECT * FROM " . strtoupper($resource));
            $stmt->execute();
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;

        case 'componentes':
            $id = $_GET['id_producto'] ?? 0;
            $stmt = $db->prepare("SELECT * FROM PRODUCTO_COMPONENTES WHERE id_producto = ?");
            $stmt->execute([$id]);
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
            break;
    }
    exit;
}

// --- 3. LÓGICA DE ESCRITURA (POST para Create, Update, Delete) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST' && in_array($resource, ['productos', 'pedidos', 'centros_trabajo'])) {
    $data = json_decode(file_get_contents("php://input"), true);
    $table = strtoupper($resource);

    try {
        if ($action === 'create') {
            // Eliminar el ID del payload para que MySQL lo genere solo (AUTO_INCREMENT)
            $firstKey = array_key_first($data);
            if (strpos($firstKey, 'id_') === 0) unset($data[$firstKey]);

            $columns = implode(", ", array_keys($data));
            $placeholders = implode(", ", array_fill(0, count($data), "?"));
            
            $stmt = $db->prepare("INSERT INTO $table ($columns) VALUES ($placeholders)");
            $success = $stmt->execute(array_values($data));
            echo json_encode(["success" => $success, "message" => $success ? "Creado" : "Error al insertar"]);

        } elseif ($action === 'update') {
            $idColumn = array_key_first($data);
            $idValue = $data[$idColumn];
            unset($data[$idColumn]); // Quitar ID del set

            $sets = [];
            foreach ($data as $key => $val) { $sets[] = "$key = ?"; }
            $sql = "UPDATE $table SET " . implode(", ", $sets) . " WHERE $idColumn = ?";
            
            $stmt = $db->prepare($sql);
            $values = array_values($data);
            $values[] = $idValue; // Añadir ID para el WHERE
            
            $success = $stmt->execute($values);
            echo json_encode(["success" => $success, "message" => $success ? "Actualizado" : "Error al actualizar"]);

        } elseif ($action === 'delete') {
            // En delete recibimos { id: value, column: name }
            $id = $data['id'];
            $column = $data['column'];
            $stmt = $db->prepare("DELETE FROM $table WHERE $column = ?");
            $success = $stmt->execute([$id]);
            echo json_encode(["success" => $success, "message" => $success ? "Eliminado" : "Error al eliminar"]);
        }
    } catch (Exception $e) {
        echo json_encode(["success" => false, "message" => "Error SQL: " . $e->getMessage()]);
    }
    exit;
}
?>