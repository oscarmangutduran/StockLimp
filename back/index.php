<?php
// back/controllers/ProductController.php

// Incluir el modelo
include_once 'models/Product.php';

class ProductController {
    private $db;
    private $product;

    public function __construct($db) {
        $this->db = $db;
        $this->product = new Product($db);
    }

    // Router para los métodos HTTP
    public function handleRequest($method) {
        switch ($method) {
            case 'GET':
                $this->readAll();
                break;
            case 'POST':
                $this->create();
                break;
            case 'PUT':
                $this->update();
                break;
            case 'DELETE':
                $this->delete();
                break;
            default:
                http_response_code(405);
                echo json_encode(["message" => "Método no permitido."]);
                break;
        }
    }

    // ============================================================
    // GET - Listar productos
    // ============================================================
    private function readAll() {
        $stmt = $this->product->read();
        $num = $stmt->rowCount();

        if ($num > 0) {
            $products_arr = array();

            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                extract($row);

                $product_item = array(
                    "producto_id"  => (int)$producto_id,
                    "nombre"       => $nombre,
                    "es_toxico"    => (bool)$es_toxico,
                    "precio_unidad"=> (float)$precio_unidad,
                    "stock_actual" => (int)$stock_actual
                );

                $products_arr[] = $product_item;
            }

            http_response_code(200);
            echo json_encode($products_arr);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "No se encontraron productos."]);
        }
    }

    // ============================================================
    // POST - Crear producto
    // ============================================================
    private function create() {
        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->nombre) || empty($data->precio_unidad)) {
            http_response_code(400);
            echo json_encode(["message" => "Datos incompletos (nombre y precio son obligatorios)."]);
            return;
        }

        $this->product->nombre        = $data->nombre;
        $this->product->es_toxico     = $data->es_toxico ?? 0;
        $this->product->precio_unidad = $data->precio_unidad;
        $this->product->stock_actual  = $data->stock_actual ?? 0;

        if ($this->product->create()) {
            http_response_code(201);
            echo json_encode(["message" => "Producto creado correctamente."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "No se pudo crear el producto."]);
        }
    }

    // ============================================================
    // PUT - Actualizar producto
    // ============================================================
    private function update() {
        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->producto_id) || empty($data->nombre) || empty($data->precio_unidad)) {
            http_response_code(400);
            echo json_encode(["message" => "Datos incompletos o falta el ID."]);
            return;
        }

        $this->product->producto_id   = $data->producto_id;
        $this->product->nombre        = $data->nombre;
        $this->product->es_toxico     = $data->es_toxico ?? 0;
        $this->product->precio_unidad = $data->precio_unidad;
        $this->product->stock_actual  = $data->stock_actual ?? 0;

        if ($this->product->update()) {
            http_response_code(200);
            echo json_encode(["message" => "Producto actualizado correctamente."]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Producto no encontrado o sin cambios."]);
        }
    }

    // ============================================================
    // DELETE - Eliminar producto
    // ============================================================
    private function delete() {
        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->producto_id)) {
            http_response_code(400);
            echo json_encode(["message" => "Error. Falta el ID del producto."]);
            return;
        }

        $this->product->producto_id = $data->producto_id;

        if ($this->product->delete()) {
            http_response_code(200);
            echo json_encode(["message" => "Producto eliminado correctamente."]);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "No se pudo eliminar. Producto no encontrado."]);
        }
    }
}
