<?php
// back/controllers/ProductController.php

include_once 'models/Product.php';

class ProductController {
    private $db;
    private $product;

    public function __construct($db) {
        $this->db = $db;
        $this->product = new Product($db);
    }

    // ----------------------------------------------------
    // MANEJADOR PRINCIPAL DE PETICIONES (CRUD)
    // ----------------------------------------------------
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
                http_response_code(405); // Método no permitido
                echo json_encode(["message" => "Método no permitido."]);
                break;
        }
    }

    // Lógica para listar todos (GET)
    private function readAll() {
        $stmt = $this->product->read();
        $num = $stmt->rowCount();

        if ($num > 0) {
            $products_arr = array();
            
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                extract($row);
                $product_item = array(
                    "producto_id" => $producto_id,
                    "nombre" => $nombre,
                    "es_toxico" => (bool)$es_toxico, // Convertir a booleano para React
                    "precio_unidad" => $precio_unidad,
                    "stock_actual" => $stock_actual
                );
                array_push($products_arr, $product_item);
            }

            http_response_code(200);
            echo json_encode($products_arr);
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "No se encontraron productos."));
        }
    }

    // Lógica para crear (POST)
    private function create() {
        $data = json_decode(file_get_contents("php://input")); // Lee el JSON de React

        if (empty($data->nombre) || empty($data->precio_unidad)) {
            http_response_code(400); // Bad Request
            echo json_encode(array("message" => "Error. Datos incompletos (nombre y precio son obligatorios)."));
            return;
        }

        $this->product->nombre = $data->nombre;
        $this->product->es_toxico = $data->es_toxico ?? 0;
        $this->product->precio_unidad = $data->precio_unidad;
        $this->product->stock_actual = $data->stock_actual ?? 0;

        if ($this->product->create()) {
            http_response_code(201); // Created
            echo json_encode(array("message" => "Producto creado correctamente."));
        } else {
            http_response_code(503); // Service Unavailable
            echo json_encode(array("message" => "No se pudo crear el producto. Error en el servidor."));
        }
    }

    // Lógica para actualizar (PUT)
    private function update() {
        $data = json_decode(file_get_contents("php://input")); // Lee el JSON

        if (empty($data->producto_id) || empty($data->nombre) || empty($data->precio_unidad)) {
            http_response_code(400);
            echo json_encode(array("message" => "Error. Datos incompletos o falta el ID."));
            return;
        }

        // Asignar todos los campos
        $this->product->producto_id = $data->producto_id;
        $this->product->nombre = $data->nombre;
        $this->product->es_toxico = $data->es_toxico ?? 0;
        $this->product->precio_unidad = $data->precio_unidad;
        $this->product->stock_actual = $data->stock_actual;

        if ($this->product->update()) {
            http_response_code(200);
            echo json_encode(array("message" => "Producto actualizado correctamente."));
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "Error. Producto no encontrado o no se realizaron cambios."));
        }
    }

    // Lógica para eliminar (DELETE)
    private function delete() {
        $data = json_decode(file_get_contents("php://input")); // Lee el JSON
        
        if (empty($data->producto_id)) {
            http_response_code(400);
            echo json_encode(array("message" => "Error. Falta el ID del producto a eliminar."));
            return;
        }

        $this->product->producto_id = $data->producto_id;

        if ($this->product->delete()) {
            http_response_code(200);
            echo json_encode(array("message" => "Producto eliminado correctamente."));
        } else {
            http_response_code(404);
            echo json_encode(array("message" => "Error al eliminar. Producto no encontrado."));
        }
    }
}
?>