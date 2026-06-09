<?php
class Order {
    private $conn;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function readAllOrders() {
        // Enlazamos los pedidos con la tabla usuarios para obtener el nombre real de quien lo solicita
        $query = "SELECT p.id_pedido, p.id_user, p.fecha_pedido, p.estado, u.nombre as operario 
                  FROM pedidos p 
                  INNER JOIN usuarios u ON p.id_user = u.id_user 
                  ORDER BY p.id_pedido DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createMultipleOrder($id_user, $productos) {
        try {
            // Activamos la transacción para proteger la integridad relacional de las tablas
            $this->conn->beginTransaction();

            // 1. Insertar la cabecera principal del pedido
            $queryOrder = "INSERT INTO pedidos SET id_user = :id_user, estado = 'PENDIENTE', fecha_pedido = NOW()";
            $stmtOrder = $this->conn->prepare($queryOrder);
            $stmtOrder->bindParam(':id_user', $id_user);
            $stmtOrder->execute();
            
            // Obtener el ID autoincremental recién generado por MySQL
            $id_pedido = $this->conn->lastInsertId();

            // 2. Preparar la consulta e insertar en bucle el detalle de cada artículo solicitado
            $queryDetail = "INSERT INTO detalle_pedido SET id_pedido = :id_pedido, id_producto = :id_producto, cantidad = :cantidad";
            $stmtDetail = $this->conn->prepare($queryDetail);

            foreach ($productos as $prod) {
                $stmtDetail->bindValue(':id_pedido', $id_pedido);
                $stmtDetail->bindValue(':id_producto', $prod['id_producto']);
                $stmtDetail->bindValue(':cantidad', $prod['cantidad']);
                $stmtDetail->execute();
            }

            // Si todas las líneas se insertaron con éxito, confirmamos los cambios en el disco duro
            $this->conn->commit();
            return true;

        } catch (Exception $e) {
            // Si cualquier inserción del bucle lanza un fallo, revertimos todo para evitar registros huérfanos
            $this->conn->rollBack();
            return false;
        }
    }

    public function updateOrder($data) {
        $query = "UPDATE pedidos SET estado = :estado, fecha_pedido = :fecha_pedido WHERE id_pedido = :id_pedido";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id_pedido', $data['id_pedido']);
        $stmt->bindParam(':estado', $data['estado']);
        $stmt->bindParam(':fecha_pedido', $data['fecha_pedido']);
        return $stmt->execute();
    }
}