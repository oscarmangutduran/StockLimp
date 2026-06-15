<?php
/**
 * Controlador Genérico para Recursos CRUD
 */
require_once 'models/GenericModel.php';

class GenericController {
    private $model;

    public function __construct($db, $resource) {
        $this->model = new GenericModel($db, $resource);
    }

    public function handleRequest($method) {
        if ($method === 'GET') {
            $this->listAll();
        } else if ($method === 'POST') {
            $action = $_GET['action'] ?? null;
            if (!$action) {
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Acción no especificada."]);
                return;
            }
            $this->executeAction($action);
        } else {
            http_response_code(405);
            echo json_encode(["success" => false, "message" => "Método no permitido."]);
        }
    }

    private function listAll() {
        $data = $this->model->read();
        // Asegurar casting de tipos booleanos y numéricos para ser consistentes
        foreach ($data as &$row) {
            if (isset($row['es_toxico'])) {
                $row['es_toxico'] = (bool)$row['es_toxico'];
            }
            if (isset($row['precio_unidad'])) {
                $row['precio_unidad'] = (float)$row['precio_unidad'];
            }
            if (isset($row['precio_total'])) {
                $row['precio_total'] = (float)$row['precio_total'];
            }
            if (isset($row['stock'])) {
                $row['stock'] = (int)$row['stock'];
            }
            if (isset($row['cantidad'])) {
                $row['cantidad'] = (int)$row['cantidad'];
            }
        }
        http_response_code(200);
        echo json_encode($data);
    }

    private function executeAction($action) {
        $input = json_decode(file_get_contents('php://input'), true);

        $success = false;
        $message = "Operación fallida.";

        switch ($action) {
            case 'create':
                $success = $this->model->create($input);
                if ($success) $message = "Registro creado correctamente.";
                break;

            case 'update':
                $success = $this->model->update($input);
                if ($success) $message = "Registro actualizado correctamente.";
                break;

            case 'delete':
                $id = $input['id'] ?? null;
                $column = $input['column'] ?? null;
                if ($id !== null) {
                    $success = $this->model->delete($id, $column);
                    if ($success) $message = "Registro eliminado correctamente.";
                } else {
                    $message = "ID de registro no proporcionado.";
                }
                break;

            default:
                http_response_code(400);
                echo json_encode(["success" => false, "message" => "Acción no válida."]);
                return;
        }

        http_response_code($success ? 200 : 500);
        echo json_encode(["success" => $success, "message" => $message]);
    }
}
