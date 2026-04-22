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
    
    if ($action === 'create_pedido') {
        $id_centro = $input['id_centro'];
        $id_user = $input['id_user'];
        $detalles = $input['detalles'];

        // Insertar en PEDIDOS
        $stmt = $conn->prepare("INSERT INTO pedidos (id_user, id_centro, estado) VALUES (?, ?, 'PENDIENTE')");
        if ($stmt) {
            $stmt->bind_param("ss", $id_user, $id_centro);
            if ($stmt->execute()) {
                $id_pedido = $conn->insert_id;
                
                // Insertar en DETALLE_PEDIDO
                $stmt_det = $conn->prepare("INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad_solicitada, precio_total_linea) VALUES (?, ?, ?, ?)");
                
                foreach ($detalles as $det) {
                    $id_prod = $det['id_producto'];
                    $cant = $det['cantidad'];
                    
                    // Obtener precio actual
                    $res_precio = $conn->query("SELECT precio_unidad FROM productos WHERE id_producto = " . intval($id_prod));
                    $prod_row = $res_precio->fetch_assoc();
                    $precio_total = $cant * floatval($prod_row['precio_unidad']);
                    
                    $stmt_det->bind_param("iidd", $id_pedido, $id_prod, $cant, $precio_total);
                    $stmt_det->execute();
                }
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["success" => false, "message" => "Error al crear pedido: " . $stmt->error]);
            }
            $stmt->close();
        } else {
            echo json_encode(["success" => false, "message" => "Error preparando pedido: " . $conn->error]);
        }
        exit;
    }

    if ($action === 'create') {
        $id_field = ($resource === 'users') ? 'id_user' : (($resource === 'productos') ? 'id_producto' : (($resource === 'centros_trabajo') ? 'id_centro' : 'id_pedido'));
        
        $keys = [];
        $placeholders = [];
        $types = "";
        $params = [];
        
        foreach ($input as $key => $val) {
            // No insertamos el ID autoincremental ni fechas automáticas
            if ($key === $id_field || strpos($key, 'fecha') !== false) continue;
            
            $keys[] = $key;
            $placeholders[] = "?";
            $types .= "s";
            $params[] = $val;
        }

        $sql = "INSERT INTO $resource (" . implode(", ", $keys) . ") VALUES (" . implode(", ", $placeholders) . ")";
        $stmt = $conn->prepare($sql);
        
        if ($stmt) {
            $stmt->bind_param($types, ...$params);
            if ($stmt->execute()) {
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["success" => false, "message" => "Error al crear: " . $stmt->error]);
            }
            $stmt->close();
        } else {
            echo json_encode(["success" => false, "message" => "Error preparando query: " . $conn->error]);
        }
    }

    if ($action === 'update') {
        $id_field = ($resource === 'users') ? 'id_user' : (($resource === 'productos') ? 'id_producto' : (($resource === 'centros_trabajo') ? 'id_centro' : 'id_pedido'));
        $id_val = $input[$id_field];
        
        $sets = [];
        $types = "";
        $params = [];
        
        foreach ($input as $key => $val) {
            if ($key === $id_field || strpos($key, 'fecha') !== false) continue;
            $sets[] = "$key = ?";
            $types .= "s";
            $params[] = $val;
        }
        
        // Añadimos el id al final para el WHERE
        $types .= "s";
        $params[] = $id_val;

        $sql = "UPDATE $resource SET " . implode(", ", $sets) . " WHERE $id_field = ?";
        $stmt = $conn->prepare($sql);
        
        if ($stmt) {
            $stmt->bind_param($types, ...$params);
            if ($stmt->execute()) {
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["success" => false, "message" => "Error al actualizar: " . $stmt->error]);
            }
            $stmt->close();
        } else {
            echo json_encode(["success" => false, "message" => "Error preparando query: " . $conn->error]);
        }
    }

    if ($action === 'delete') {
        $id_field = ($resource === 'users') ? 'id_user' : (($resource === 'productos') ? 'id_producto' : (($resource === 'centros_trabajo') ? 'id_centro' : 'id_pedido'));
        $id_val = $input[$id_field];
        
        $sql = "DELETE FROM $resource WHERE $id_field = ?";
        $stmt = $conn->prepare($sql);
        if ($stmt) {
            $stmt->bind_param("s", $id_val);
            if ($stmt->execute()) {
                echo json_encode(["success" => true]);
            } else {
                echo json_encode(["success" => false, "message" => "Error al eliminar: " . $stmt->error]);
            }
            $stmt->close();
        }
    }
}
$conn->close();
?>