    <?php
require_once 'models/Center.php';

class CenterController {
    private $centerModel;

    public function __construct($db) {
        $this->centerModel = new Center($db);
    }

    public function handleRequest($method, $action, $data) {
        if ($method === 'GET') {
            echo json_encode($this->centerModel->readAllCenters());
            exit;
        }

        if ($method === 'POST') {
            switch ($action) {
                case 'create':
                    $res = $this->centerModel->createCenter($data);
                    echo json_encode(["success" => $res]);
                    break;
                case 'update':
                    $res = $this->centerModel->updateCenter($data);
                    echo json_encode(["success" => $res]);
                    break;
                case 'delete':
                    $id = $data['id'] ?? null;
                    $column = $data['column'] ?? 'id_centro';
                    $res = $this->centerModel->deleteRecord($id, $column);
                    echo json_encode(["success" => $res]);
                    break;
                default:
                    http_response_code(400);
                    echo json_encode(["success" => false, "message" => "Acción POST de centros inválida"]);
                    break;
            }
            exit;
        }
    }
}