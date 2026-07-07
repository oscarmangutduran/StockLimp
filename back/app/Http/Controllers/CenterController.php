<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\WorkCenter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class CenterController extends Controller
{
    public function __construct()
    {
        // Auto-sanación de la base de datos para añadir las columnas ciudad y fecha_registro requeridas por el frontend
        try {
            if (Schema::hasTable('centros_trabajo')) {
                if (!Schema::hasColumn('centros_trabajo', 'ciudad')) {
                    DB::statement("ALTER TABLE centros_trabajo ADD COLUMN ciudad VARCHAR(100) DEFAULT NULL");
                }
                if (!Schema::hasColumn('centros_trabajo', 'numero_ruta')) {
                    DB::statement("ALTER TABLE centros_trabajo ADD COLUMN numero_ruta INT DEFAULT NULL");
                }
                if (!Schema::hasColumn('centros_trabajo', 'fecha_registro')) {
                    DB::statement("ALTER TABLE centros_trabajo ADD COLUMN fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
                }
            }
        } catch (\Exception $e) {
            // Evitamos bloquear la aplicación si la base de datos no está disponible temporalmente
        }
    }

    public function index()
    {
        return response()->json(WorkCenter::all(), 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'direccion' => 'nullable|string|max:255',
            'ciudad' => 'nullable|string|max:100',
            'numero_ruta' => 'nullable|integer|between:1,17',
        ]);

        $data = $validated;
        $data['nombre_centro'] = $data['nombre'];
        unset($data['nombre']);

        $center = WorkCenter::create($data);
        return response()->json(['success' => true, 'center' => $center], 201);
    }

    public function update(Request $request)
    {
        $request->validate([
            'id_centro' => 'required|exists:centros_trabajo,id_centro',
            'nombre' => 'required|string|max:100',
            'direccion' => 'nullable|string|max:255',
            'ciudad' => 'nullable|string|max:100',
            'numero_ruta' => 'nullable|integer|between:1,17',
        ]);

        $center = WorkCenter::find($request->id_centro);

        $data = $request->only(['nombre', 'direccion', 'ciudad', 'numero_ruta']);
        $data['nombre_centro'] = $data['nombre'];
        unset($data['nombre']);

        $center->update($data);

        return response()->json(['success' => true, 'center' => $center], 200);
    }

    public function destroy(Request $request)
    {
        $request->validate([
            'id' => 'required|exists:centros_trabajo,id_centro',
        ]);

        WorkCenter::destroy($request->id);

        return response()->json(['success' => true, 'message' => 'Centro de trabajo eliminado'], 200);
    }
}
