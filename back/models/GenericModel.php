<?php
/**
 * Modelo Genérico para Operaciones CRUD
 */
class GenericModel {
    private $db;
    private $table;
    private $primaryKey;

    // Mapa de tablas a sus claves primarias
    private static $pkMap = [
        "productos" => "id_producto",
        "pedidos" => "id_pedido",
        "centros_trabajo" => "id_centro"
    ];

    public function __construct($conn, $table) {
        // Validar que la tabla esté permitida para evitar inyección SQL
        if (!array_key_exists($table, self::$pkMap)) {
            throw new Exception("Tabla no permitida");
        }
        $this->db = $conn;
        $this->table = $table;
        $this->primaryKey = self::$pkMap[$table];
    }

    /**
     * Obtener todos los registros
     */
    public function read() {
        $sql = "SELECT * FROM `{$this->table}`";
        // Si es productos, ordenar por nombre. Si no, por la clave primaria
        if ($this->table === 'productos') {
            $sql .= " ORDER BY nombre ASC";
        } else {
            $sql .= " ORDER BY `{$this->primaryKey}` DESC";
        }

        try {
            $query = $this->db->prepare($sql);
            $query->execute();
            return $query->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            return [];
        }
    }

    /**
     * Crear un nuevo registro
     */
    public function create($data) {
        // Excluir la clave primaria si viene vacía
        if (isset($data[$this->primaryKey])) {
            unset($data[$this->primaryKey]);
        }

        // Limpiar campos que no pertenezcan al cuerpo o que estén vacíos/nulos de forma incorrecta
        $fields = [];
        $placeholders = [];
        $values = [];

        foreach ($data as $key => $value) {
            $fields[] = "`$key`";
            $placeholders[] = ":$key";
            // Convertir 'es_toxico' a booleano/entero
            if ($key === 'es_toxico') {
                $values[":$key"] = ($value === true || $value === 'true' || $value == 1) ? 1 : 0;
            } else {
                $values[":$key"] = ($value === '') ? null : $value;
            }
        }

        $sql = "INSERT INTO `{$this->table}` (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";

        try {
            $query = $this->db->prepare($sql);
            return $query->execute($values);
        } catch (PDOException $e) {
            error_log("Error insert: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Actualizar un registro existente
     */
    public function update($data) {
        if (!isset($data[$this->primaryKey])) {
            return false;
        }

        $idVal = $data[$this->primaryKey];
        unset($data[$this->primaryKey]);

        $sets = [];
        $values = [":id_val" => $idVal];

        foreach ($data as $key => $value) {
            $sets[] = "`$key` = :$key";
            if ($key === 'es_toxico') {
                $values[":$key"] = ($value === true || $value === 'true' || $value == 1) ? 1 : 0;
            } else {
                $values[":$key"] = ($value === '') ? null : $value;
            }
        }

        $sql = "UPDATE `{$this->table}` SET " . implode(', ', $sets) . " WHERE `{$this->primaryKey}` = :id_val";

        try {
            $query = $this->db->prepare($sql);
            return $query->execute($values);
        } catch (PDOException $e) {
            error_log("Error update: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Eliminar un registro
     */
    public function delete($id, $column = null) {
        $deleteCol = $column ?? $this->primaryKey;
        // Validar que la columna de eliminación sea segura (solo caracteres alfanuméricos y guiones bajos)
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $deleteCol)) {
            return false;
        }

        $sql = "DELETE FROM `{$this->table}` WHERE `$deleteCol` = :id";

        try {
            $query = $this->db->prepare($sql);
            $query->bindParam(':id', $id);
            return $query->execute();
        } catch (PDOException $e) {
            error_log("Error delete: " . $e->getMessage());
            return false;
        }
    }
}
