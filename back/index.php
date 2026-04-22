<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

$host = "localhost";
$user = "root";
$pass = "";
$db   = "stocklimp";

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    echo json_encode(["error" => "Conexión fallida"]);
    exit;
}

$resource = $_GET['resource'] ?? '';
$method   = $_SERVER['REQUEST_METHOD'];
$input    = json_decode(file_get_contents('php://input'), true);

// --- LÓGICA DE LOGIN ---
if ($method === 'POST' && $resource === 'login') {
    $user_input = $input['user'] ?? '';
    $pass_input = $input['pass'] ?? '';

    // Buscamos por nombre O email y verificamos la contraseña
    $stmt = $conn->prepare("SELECT id_user, nombre, email, rol FROM users WHERE (nombre = ? OR email = ?) AND password_hash = ?");
    $stmt->bind_param("sss", $user_input, $user_input, $pass_input);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($user_data = $result->fetch_assoc()) {
        echo json_encode(["success" => true, "user" => $user_data]);
    } else {
        echo json_encode(["success" => false, "message" => "Credenciales incorrectas"]);
    }
    exit;
}

// --- OPERACIONES CRUD ---
if ($method === 'GET') {
    switch ($resource) {
        case 'productos': $sql = "SELECT * FROM productos"; break;
        case 'pedidos': $sql = "SELECT * FROM pedidos"; break;
        case 'centros_trabajo': $sql = "SELECT * FROM centros_trabajo"; break;
        case 'users': $sql = "SELECT id_user, nombre, email, rol, fecha_creacion FROM users"; break;
        default: echo json_encode([]); exit;
    }
    $res = $conn->query($sql);
    echo json_encode($res->fetch_all(MYSQLI_ASSOC));

} elseif ($method === 'POST') {
    $action = $_GET['action'] ?? '';
    
    if ($action === 'create') {
        if ($resource === 'users') {
            $stmt = $conn->prepare("INSERT INTO users (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)");
            $stmt->bind_param("ssss", $input['nombre'], $input['email'], $input['password_hash'], $input['rol']);
        } 
        // ... añadir aquí el resto de casos (productos, etc) siguiendo el mismo patrón bind_param ...
        
        if ($stmt->execute()) echo json_encode(["success" => true]);
        else echo json_encode(["success" => false, "error" => $conn->error]);
    }

    if ($action === 'delete') {
        $id_field = ($resource === 'users') ? 'id_user' : 'id_' . substr($resource, 0, -1);
        $id_val = $input[$id_field];
        $sql = "DELETE FROM $resource WHERE $id_field = $id_val";
        if ($conn->query($sql)) echo json_encode(["success" => true]);
    }
}
$conn->close();
?>