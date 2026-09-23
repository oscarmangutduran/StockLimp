<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;

class ProductController extends Controller
{
    public function index()
    {
        return response()->json(Product::all(), 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'sku' => 'nullable|string|max:100',
            'precio_unidad' => 'required|numeric',
            'stock_actual' => 'required|integer|min:0',
            'es_toxico' => 'nullable|boolean',
            'imagen' => 'nullable|string|max:255',
            'ficha_tecnica' => 'nullable|string|max:255'
        ]);

        $product = Product::create($validated);
        return response()->json(['success' => true, 'product' => $product], 201);
    }

    public function update(Request $request)
    {
        $request->validate(['id_producto' => 'required|exists:productos,id_producto']);
        
        $product = Product::find($request->id_producto);
        $product->update($request->all());

        return response()->json(['success' => true, 'product' => $product], 200);
    }

    public function destroy(Request $request)
    {
        $request->validate(['id_producto' => 'required|exists:productos,id_producto']);
        Product::destroy($request->id_producto);

        return response()->json(['success' => true, 'message' => 'Producto eliminado'], 200);
    }

    public function exportarExcel()
    {
        $raw = \Maatwebsite\Excel\Facades\Excel::raw(new \App\Exports\ProductExport, \Maatwebsite\Excel\Excel::XLSX);
        return response($raw, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="productos.xlsx"',
        ]);
    }
}