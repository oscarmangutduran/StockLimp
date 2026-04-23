<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE, PUT");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$conn = new mysqli("localhost", "root", "", "stocklimp");
if ($conn->connect_error) {
    die(json_encode(["success" => false, "message" => "Fallo de conexión"]));
}

$resource = $_GET['resource'] ?? '';
$action = $_GET['action'] ?? '';
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

// --- LOGIN ---
if ($method === 'POST' && $resource === 'login') {
    $u = trim($input['user'] ?? '');
    $p = trim($input['pass'] ?? '');
    $stmt = $conn->prepare("SELECT id_user, nombre, rol, password_hash FROM users WHERE LOWER(nombre) = LOWER(?) OR LOWER(email) = LOWER(?)");
    $stmt->bind_param("ss", $u, $u);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($user = $result->fetch_assoc()) {
        if ($p === $user['password_hash'] || password_verify($p, $user['password_hash'])) {
            unset($user['password_hash']);
            echo json_encode(["success" => true, "user" => $user]);
        } else { echo json_encode(["success" => false, "message" => "Password incorrecto"]); }
    } else { echo json_encode(["success" => false, "message" => "Usuario no encontrado"]); }
    exit;
}

// --- PEDIDOS MÚLTIPLES ---
if ($method === 'POST' && $action === 'create_pedido_multiple') {
    $id_user = $input['id_user'] ?? 0;
    $productos = $input['productos'] ?? []; 
    $id_centro = $input['id_centro'] ?? 1; 
    $fecha = date('Y-m-d H:i:s');
    $conn->begin_transaction();
    try {
        $stmt1 = $conn->prepare("INSERT INTO pedidos (fecha_creacion, estado, id_user, id_centro) VALUES (?, 'PENDIENTE', ?, ?)");
        $stmt1->bind_param("sii", $fecha, $id_user, $id_centro);
        $stmt1->execute();
        $id_pedido = $conn->insert_id;
        
        $stmt2 = $conn->prepare("INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad_solicitada, precio_total_linea) VALUES (?, ?, ?, 0)");
        foreach ($productos as $p) {
            $stmt2->bind_param("iid", $id_pedido, $p['id_producto'], $p['cantidad']);
            $stmt2->execute();
        }
        $conn->commit();
        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
    exit;
}

// --- CONSULTAS GET (Pivoteado: Productos en Columnas) ---
if ($method === 'GET') {
    if ($resource === 'pedidos') {
        $prod_res = $conn->query("SELECT nombre FROM productos");
        $pivot_cols = [];
        if ($prod_res) {
            while($row = $prod_res->fetch_assoc()){
                $nombre_safe = $conn->real_escape_string($row['nombre']);
                $nombre_alias = strtoupper($row['nombre']);
                $pivot_cols[] = "MAX(CASE WHEN pr.nombre = '$nombre_safe' THEN dp.cantidad_solicitada ELSE 0 END) AS '$nombre_alias'";
            }
        }
        $pivot_sql = count($pivot_cols) > 0 ? implode(",\n                    ", $pivot_cols) . "," : "";

        $sql = "SELECT 
                    p.id_pedido AS 'ID',
                    u.nombre AS 'SOLICITANTE',
                    c.nombre_centro AS 'CENTRO',
                    p.fecha_creacion AS 'FECHA',
                    $pivot_sql
                    p.estado AS 'ESTADO'
                FROM pedidos p
                JOIN users u ON p.id_user = u.id_user
                JOIN centros_trabajo c ON p.id_centro = c.id_centro
                LEFT JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
                LEFT JOIN productos pr ON dp.id_producto = pr.id_producto
                GROUP BY p.id_pedido
                ORDER BY p.id_pedido DESC";
    } else {
        $sql = "SELECT * FROM $resource";
    }
    $res = $conn->query($sql);
    echo json_encode($res ? $res->fetch_all(MYSQLI_ASSOC) : []);
    exit;
}

// --- CRUD ACCIONES ---
if ($method === 'POST') {
    if ($action === 'update') {
        if ($resource === 'pedidos') {
            $id_pedido = $conn->real_escape_string($input['ID']);
            $estado = $conn->real_escape_string($input['ESTADO']);
            $sql = "UPDATE pedidos SET estado = '$estado' WHERE id_pedido = '$id_pedido'";
            $res = $conn->query($sql);
            echo json_encode(["success" => $res, "message" => $conn->error]);
            exit;
        }
        
        $id_col = array_key_first($input);
        $id_val = $input[$id_col];
        unset($input[$id_col]);
        $sets = [];
        foreach ($input as $k => $v) { $sets[] = "`$k` = '" . $conn->real_escape_string($v) . "'"; }
        $sql = "UPDATE $resource SET " . implode(", ", $sets) . " WHERE `$id_col` = '$id_val'";
        $res = $conn->query($sql);
        echo json_encode(["success" => $res, "message" => $conn->error]);
    } elseif ($action === 'delete') {
        $id = $conn->real_escape_string($input['id']);
        $col = $conn->real_escape_string($input['column']);
        if ($resource === 'pedidos' && $col === 'ID') {
            $col = 'id_pedido';
        }
        $conn->query("SET FOREIGN_KEY_CHECKS = 0");
        $res = $conn->query("DELETE FROM $resource WHERE `$col` = '$id'");
        $err = $conn->error;
        $conn->query("SET FOREIGN_KEY_CHECKS = 1");
        echo json_encode(["success" => $res, "message" => $err]);
    } elseif ($action === 'create') {
        $cols = implode(", ", array_keys($input));
        $vals = "'" . implode("', '", array_map([$conn, 'real_escape_string'], array_values($input))) . "'";
        echo json_encode(["success" => $conn->query("INSERT INTO $resource ($cols) VALUES ($vals)")]);
    }
    exit;
}
$conn->close();