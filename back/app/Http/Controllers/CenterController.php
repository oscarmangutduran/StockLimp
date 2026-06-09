<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Center;

class CenterController extends Controller
{
    // Obtener todos los centros
    public function index() {
        return response()->json(Center::orderBy('id_centro', 'desc')->get());
    }

    // Crear un nuevo centro
    public function store(Request $request) {
        $center = Center::create($request->all());
        return response()->json(['success' => (bool)$center]);
    }

    // Actualizar un centro existente
    public function update(Request $request) {
        $center = Center::find($request->input('id_centro'));
        if ($center) {
            $res = $center->update($request->all());
            return response()->json(['success' => $res]);
        }
        return response()->json(['success' => false]);
    }

    // Eliminar un centro
    public function destroy(Request $request) {
        $id = $request->input('id');
        $res = Center::destroy($id);
        return response()->json(['success' => (bool)$res]);
    }
}