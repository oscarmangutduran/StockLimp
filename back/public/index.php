<?php
/**
 * Laravel / Fallback Hybrid Entrypoint
 * Permite ejecutar la aplicación en PHP 8.0 sin dependencias instaladas,
 * y arranca Laravel 12 automáticamente cuando se actualice PHP y se corra composer.
 */

define('LARAVEL_START', microtime(true));

$vendorPath = __DIR__.'/../vendor/autoload.php';

if (file_exists($vendorPath)) {
    // -------------------------------------------------------------
    // RUTA A: LARAVEL 12 (Si las dependencias están instaladas)
    // -------------------------------------------------------------
    require $vendorPath;

    if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
        require $maintenance;
    }

    /** @var Illuminate\Foundation\Application $app */
    $app = require_once __DIR__.'/../bootstrap/app.php';
    $app->handleRequest(Illuminate\Http\Request::capture());

} else {
    // -------------------------------------------------------------
    // RUTA B: ENRUTADOR SIMULADO (Soporte inmediato para PHP 8.0.30)
    // -------------------------------------------------------------
    
    // Configuración de CORS completa para el servidor de desarrollo de Vite
    if (isset($_SERVER['HTTP_ORIGIN'])) {
        header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
        header("Access-Control-Max-Age: 3600");
    }
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }

    header("Content-Type: application/json; charset=UTF-8");

    // Conexión directa a MySQL (XAMPP activo)
    try {
        $db = new PDO("mysql:host=127.0.0.1;dbname=stocklimp;charset=utf8mb4", "root", "");
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error de conexión a la base de datos: " . $e->getMessage()]);
        exit;
    }

    // Obtener la ruta relativa después de index.php (compatible con subdirectorios de Apache)
    $path = $_SERVER['PATH_INFO'] ?? '';
    if (empty($path)) {
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $pos = strpos($uri, 'index.php');
        if ($pos !== false) {
            $path = substr($uri, $pos + 9);
        } else {
            $path = $uri;
        }
    }
    $uri = preg_replace('/^\/api/', '', $path);
    $uri = trim($uri, '/');

    $method = $_SERVER['REQUEST_METHOD'];

    switch ($uri) {
        case 'usuarios/login':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(["success" => false, "message" => "Método no permitido"]);
                break;
            }
            $input = json_decode(file_get_contents('php://input'), true);
            $email = $input['email'] ?? null;
            $password = $input['password'] ?? null;

            if (!$email || !$password) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Faltan datos obligatorios."]);
                break;
            }

            $stmt = $db->prepare("SELECT * FROM usuarios WHERE email = ? LIMIT 1");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user && ($password === $user['password'] || password_verify($password, $user['password']))) {
                echo json_encode([
                    "success" => true,
                    "user" => [
                        "id_user" => (int)$user['id_user'],
                        "nombre" => $user['nombre'],
                        "email" => $user['email'],
                        "rol" => $user['rol']
                    ]
                ]);
            } else {
                echo json_encode(["success" => false, "message" => "Credenciales incorrectas."]);
            }
            break;

        case 'productos':
            if ($method === 'GET') {
                $q = $db->query("SELECT * FROM productos ORDER BY id_producto DESC");
                $res = $q->fetchAll(PDO::FETCH_ASSOC);
                foreach ($res as &$r) {
                    $r['id_producto'] = (int)$r['id_producto'];
                    $r['es_toxico'] = (bool)$r['es_toxico'];
                    $r['precio_unidad'] = (float)$r['precio_unidad'];
                    $r['stock_actual'] = (int)$r['stock_actual'];
                }
                echo json_encode($res);
            } else if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $stmt = $db->prepare("INSERT INTO productos (nombre, sku, precio_unidad, stock_actual, es_toxico) VALUES (?, ?, ?, ?, ?)");
                $success = $stmt->execute([
                    $input['nombre'],
                    $input['sku'] ?? null,
                    $input['precio_unidad'],
                    $input['stock_actual'],
                    $input['es_toxico'] ? 1 : 0
                ]);
                echo json_encode(["success" => $success]);
            }
            break;

        case 'productos/update':
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $stmt = $db->prepare("UPDATE productos SET nombre = ?, sku = ?, precio_unidad = ?, stock_actual = ?, es_toxico = ? WHERE id_producto = ?");
                $success = $stmt->execute([
                    $input['nombre'],
                    $input['sku'] ?? null,
                    $input['precio_unidad'],
                    $input['stock_actual'],
                    $input['es_toxico'] ? 1 : 0,
                    $input['id_producto']
                ]);
                echo json_encode(["success" => $success]);
            }
            break;

        case 'productos/delete':
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $stmt = $db->prepare("DELETE FROM productos WHERE id_producto = ?");
                $success = $stmt->execute([$input['id']]);
                echo json_encode(["success" => $success]);
            }
            break;

        case 'centros_trabajo':
            if ($method === 'GET') {
                $q = $db->query("SELECT * FROM centros_trabajo ORDER BY id_centro DESC");
                $res = $q->fetchAll(PDO::FETCH_ASSOC);
                foreach ($res as &$r) {
                    $r['id_centro'] = (int)$r['id_centro'];
                }
                echo json_encode($res);
            } else if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $stmt = $db->prepare("INSERT INTO centros_trabajo (nombre, direccion, ciudad) VALUES (?, ?, ?)");
                $success = $stmt->execute([$input['nombre'], $input['direccion'], $input['ciudad']]);
                echo json_encode(["success" => $success]);
            }
            break;

        case 'centros_trabajo/update':
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $stmt = $db->prepare("UPDATE centros_trabajo SET nombre = ?, direccion = ?, ciudad = ? WHERE id_centro = ?");
                $success = $stmt->execute([
                    $input['nombre'],
                    $input['direccion'],
                    $input['ciudad'],
                    $input['id_centro']
                ]);
                echo json_encode(["success" => $success]);
            }
            break;

        case 'centros_trabajo/delete':
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $stmt = $db->prepare("DELETE FROM centros_trabajo WHERE id_centro = ?");
                $success = $stmt->execute([$input['id']]);
                echo json_encode(["success" => $success]);
            }
            break;

        case 'pedidos':
            if ($method === 'GET') {
                $q = $db->query("SELECT p.*, u.nombre as operario FROM pedidos p JOIN usuarios u ON p.id_user = u.id_user ORDER BY p.id_pedido DESC");
                $res = $q->fetchAll(PDO::FETCH_ASSOC);
                foreach ($res as &$r) {
                    $r['id_pedido'] = (int)$r['id_pedido'];
                    $r['id_user'] = (int)$r['id_user'];
                }
                echo json_encode($res);
            }
            break;

        case 'pedidos/multiple':
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                try {
                    $db->beginTransaction();
                    $stmt = $db->prepare("INSERT INTO pedidos (id_user, fecha_pedido, estado) VALUES (?, NOW(), 'PENDIENTE')");
                    $stmt->execute([$input['id_user']]);
                    $id_pedido = $db->lastInsertId();

                    $stmtDetail = $db->prepare("INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad) VALUES (?, ?, ?)");
                    foreach ($input['productos'] as $prod) {
                        $stmtDetail->execute([$id_pedido, $prod['id_producto'], $prod['cantidad']]);
                    }
                    $db->commit();
                    echo json_encode(["success" => true]);
                } catch (Exception $e) {
                    $db->rollBack();
                    echo json_encode(["success" => false, "error" => $e->getMessage()]);
                }
            }
            break;

        case 'pedidos/update':
            if ($method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                $stmt = $db->prepare("UPDATE pedidos SET estado = ?, fecha_pedido = ? WHERE id_pedido = ?");
                $success = $stmt->execute([
                    $input['estado'],
                    $input['fecha_pedido'],
                    $input['id_pedido']
                ]);
                echo json_encode(["success" => $success]);
            }
            break;

        default:
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Ruta simulada no encontrada: " . $uri]);
            break;
    }
}
