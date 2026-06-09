<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;

class ProductController extends Controller
{
    // Obtener todos los productos ordenados por ID descendente
    public function index() {
        return response()->json(Product::orderBy('id_producto', 'desc')->get());
    }

    // Crear un nuevo producto
    public function store(Request $request) {
        $product = Product::create($request->all());
        return response()->json(['success' => (bool)$product]);
    }

    // Actualizar un producto existente
    public function update(Request $request) {
        $product = Product::find($request->input('id_producto'));
        if ($product) {
            $res = $product->update($request->all());
            return response()->json(['success' => $res]);
        }
        return response()->json(['success' => false, 'message' => 'Producto no encontrado']);
    }

    // Eliminar un producto
    public function destroy(Request $request) {
        $id = $request->input('id');
        $res = Product::destroy($id);
        return response()->json(['success' => (bool)$res]);
    }
}