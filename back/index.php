<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once 'config/Database.php';
$database = new Database();
$db = $database->getConnection();

// Obtener tabla solicitada desde el frontend
$resource = isset($_GET['resource']) ? $_GET['resource'] : null;

if ($resource) {
    try {
        // Evitar inyección SQL: solo tablas permitidas
        $allowedTables = ['productos', 'users', 'pedidos', 'centros_trabajo', 'detalle_pedido'];
        if (!in_array($resource, $allowedTables)) {
            echo json_encode([]);
            exit();
        }

        // Consultar todos los registros de la tabla
        $stmt = $db->prepare("SELECT * FROM `$resource`");
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode($rows);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([]);
    }
} else {
    echo json_encode([]);
}
?>
