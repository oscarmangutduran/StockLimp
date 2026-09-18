<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\WorkCenter;

try {
    $filePath = 'c:/xampp/htdocs/StockLimp/trabajadores caceres.xls';
    if (!file_exists($filePath)) {
        die("No se encuentra el archivo: $filePath\n");
    }

    $reader = \PhpOffice\PhpSpreadsheet\IOFactory::createReaderForFile($filePath);
    $spreadsheet = $reader->load($filePath);
    $sheet = $spreadsheet->getActiveSheet();
    $totalRows = $sheet->getHighestRow();

    echo "Procesando $totalRows filas del Excel...\n";

    $defaultPassword = Hash::make('12345');
    $centrosNuevos = 0;
    $usuariosCreados = 0;
    $usuariosActualizados = 0;
    $asignacionesCreadas = 0;

    DB::beginTransaction();

    for ($row = 2; $row <= $totalRows; $row++) {
        $id_centro = $row - 1;
        $telefono = trim((string)$sheet->getCell('A' . $row)->getValue());
        $nombre = trim((string)$sheet->getCell('B' . $row)->getValue());
        $apellido = trim((string)$sheet->getCell('D' . $row)->getValue());
        $ciudad = trim((string)$sheet->getCell('E' . $row)->getValue());
        $rawEmail = trim((string)$sheet->getCell('C' . $row)->getValue());
        $centroDesc = trim((string)$sheet->getCell('H' . $row)->getValue());

        // Sanitizar email
        $cleanEmail = str_replace([' ', "\n", "\r", "\t"], '', strtolower($rawEmail));
        if (empty($cleanEmail)) {
            // Generar email único si no tiene
            $slugNombre = preg_replace('/[^a-z0-9]/', '', strtolower($nombre));
            $slugApellido = preg_replace('/[^a-z0-9]/', '', strtolower($apellido));
            $cleanEmail = "{$slugNombre}.{$slugApellido}.{$id_centro}@stocklimp.com";
        }

        // 1. Asegurar Centro de Trabajo
        $centro = WorkCenter::find($id_centro);
        if (!$centro) {
            $centro = new WorkCenter();
            $centro->id_centro = $id_centro;
            $centro->nombre = $centroDesc ?: "Centro $id_centro";
            $centro->direccion = $centroDesc ?: "Centro $id_centro";
            $centro->ciudad = $ciudad ?: 'Cáceres';
            $centro->fecha_registro = '2026-06-17 00:00:00';
            $centro->save();
            $centrosNuevos++;
        }

        // 2. Crear o actualizar Usuario
        $user = User::where('email', $cleanEmail)->first();
        if (!$user) {
            // Intentar buscar por nombre y apellido
            $user = User::where('nombre', $nombre)->where('apellido', $apellido)->first();
        }

        if (!$user) {
            $user = new User();
            $user->nombre = $nombre;
            $user->apellido = $apellido;
            $user->email = $cleanEmail;
            $user->telefono = $telefono;
            $user->direccion = $ciudad;
            $user->password_hash = $defaultPassword;
            $user->rol = 'usuario';
            $user->estado = 'activo';
            $user->id_centro = $id_centro;
            $user->save();
            $usuariosCreados++;
        } else {
            // Actualizar datos si faltaban
            $user->nombre = $nombre ?: $user->nombre;
            $user->apellido = $apellido ?: $user->apellido;
            if ($telefono) $user->telefono = $telefono;
            if ($ciudad) $user->direccion = $ciudad;
            $user->id_centro = $id_centro;
            $user->save();
            $usuariosActualizados++;
        }

        // 3. Vincular en tabla pivote centro_user
        $existsRelation = DB::table('centro_user')
            ->where('id_user', $user->id_user)
            ->where('id_centro', $id_centro)
            ->exists();

        if (!$existsRelation) {
            DB::table('centro_user')->insert([
                'id_user' => $user->id_user,
                'id_centro' => $id_centro,
            ]);
            $asignacionesCreadas++;
        }
    }

    DB::commit();

    echo "========================================\n";
    echo "¡IMPORTACIÓN COMPLETADA CON ÉXITO!\n";
    echo "Centros nuevos creados (del 1 al 11): $centrosNuevos\n";
    echo "Usuarios nuevos creados: $usuariosCreados\n";
    echo "Usuarios actualizados: $usuariosActualizados\n";
    echo "Asignaciones vinculadas en centro_user: $asignacionesCreadas\n";
    echo "Total centros en BD: " . WorkCenter::count() . "\n";
    echo "Total usuarios en BD: " . User::count() . "\n";
    echo "========================================\n";

} catch (Exception $e) {
    DB::rollBack();
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
}
