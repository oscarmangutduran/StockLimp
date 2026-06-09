<?php
class Product {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function readAll() {
        $stmt = $this->conn->prepare("SELECT id_producto, nombre, sku, es_toxico, precio_unidad, stock_actual, fecha_registro FROM productos ORDER BY id_producto ASC");
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function createProduct($data) {
        $stmt = $this->conn->prepare("INSERT INTO productos (nombre, sku, es_toxico, precio_unidad, stock_actual) VALUES (:nombre, :sku, :es_toxico, :precio_unidad, :stock_actual)");
        return $stmt->execute([
            ':nombre'        => $data['nombre'] ?? '',
            ':sku'           => $data['sku'] ?? null,
            ':es_toxico'     => isset($data['es_toxico']) ? (int)$data['es_toxico'] : 0,
            ':precio_unidad' => floatval($data['precio_unidad'] ?? 0),
            ':stock_actual'  => floatval($data['stock_actual'] ?? 0)
        ]);
    }

    public function updateProduct($data) {
        $stmt = $this->conn->prepare("UPDATE productos SET nombre = :nombre, sku = :sku, es_toxico = :es_toxico, precio_unidad = :precio_unidad, stock_actual = :stock_actual WHERE id_producto = :id_producto");
        return $stmt->execute([
            ':nombre'        => $data['nombre'] ?? '',
            ':sku'           => $data['sku'] ?? null,
            ':es_toxico'     => isset($data['es_toxico']) ? (int)$data['es_toxico'] : 0,
            ':precio_unidad' => floatval($data['precio_unidad'] ?? 0),
            ':stock_actual'  => floatval($data['stock_actual'] ?? 0),
            ':id_producto'   => (int)$data['id_producto']
        ]);
    }

    public function readAllOrders() {
        $stmt = $this->conn->prepare("SELECT p.id_pedido, u.nombre AS operario, p.estado, p.fecha_pedido FROM pedidos p INNER JOIN usuarios u ON p.id_user = u.id_user ORDER BY p.id_pedido DESC");
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function updateOrder($data) {
        $stmt = $this->conn->prepare("UPDATE pedidos SET estado = :estado, fecha_pedido = :fecha_pedido WHERE id_pedido = :id_pedido");
        return $stmt->execute([
            ':estado'       => $data['estado'] ?? 'PENDIENTE',
            ':fecha_pedido' => $data['fecha_pedido'] ?? date('Y-m-d H:i:s'),
            ':id_pedido'    => (int)$data['id_pedido']
        ]);
    }

    public function createMultipleOrder($data) {
        $productos = $data['productos'] ?? [];
        $id_user = $data['id_user'] ?? null;
        if (!$id_user || empty($productos)) return false;

        try {
            $this->conn->beginTransaction();
            $stmt = $this->conn->prepare("INSERT INTO pedidos (id_user, estado) VALUES (:id_user, 'PENDIENTE')");
            $stmt->execute([':id_user' => $id_user]);
            $id_pedido = $this->conn->lastInsertId();

            $stmtDetalle = $this->conn->prepare("INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad) VALUES (:id_pedido, :id_producto, :cantidad)");
            foreach ($productos as $p) {
                $stmtDetalle->execute([
                    ':id_pedido'   => $id_pedido,
                    ':id_producto' => $p['id_producto'],
                    ':cantidad'    => floatval($p['cantidad'])
                ]);
            }
            $this->conn->commit();
            return true;
        } catch (Exception $e) {
            $this->conn->rollBack();
            return false;
        }
    }

    public function readAllCenters() {
        $stmt = $this->conn->prepare("SELECT id_centro, nombre, direccion, ciudad, fecha_registro FROM centros_trabajo ORDER BY id_centro ASC");
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function createCenter($data) {
        $stmt = $this->conn->prepare("INSERT INTO centros_trabajo (nombre, direccion, ciudad) VALUES (:nombre, :direccion, :ciudad)");
        return $stmt->execute([
            ':nombre'    => $data['nombre'] ?? '',
            ':direccion' => $data['direccion'] ?? '',
            ':ciudad'    => $data['ciudad'] ?? ''
        ]);
    }

    public function updateCenter($data) {
        $stmt = $this->conn->prepare("UPDATE centros_trabajo SET nombre = :nombre, direccion = :direccion, ciudad = :ciudad WHERE id_centro = :id_centro");
        return $stmt->execute([
            ':nombre'    => $data['nombre'] ?? '',
            ':direccion' => $data['direccion'] ?? '',
            ':ciudad'    => $data['ciudad'] ?? '',
            ':id_centro' => (int)$data['id_centro']
        ]);
    }

    public function deleteRecord($table, $id, $column) {
        $allowed = ['productos', 'pedidos', 'centros_trabajo'];
        if (!in_array($table, $allowed) || !$id || !$column) return false;

        $stmt = $this->conn->prepare("DELETE FROM $table WHERE $column = :id");
        return $stmt->execute([':id' => $id]);
    }
}