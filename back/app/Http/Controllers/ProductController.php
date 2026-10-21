<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with('componentes');

        if ($request->has('search') && !empty($request->input('search'))) {
            $s = $request->input('search');
            $query->where(function ($q) use ($s) {
                $q->where('nombre', 'like', "%{$s}%")
                  ->orWhere('sku', 'like', "%{$s}%");
            });
        }

        if ($request->has('es_toxico')) {
            $query->where('es_toxico', $request->input('es_toxico'));
        }

        if ($request->has('es_estandar_pedido')) {
            $query->where('es_estandar_pedido', $request->input('es_estandar_pedido'));
        }

        if ($request->has('page') || $request->has('per_page')) {
            $perPage = (int) $request->input('per_page', 12);
            return response()->json($query->paginate($perPage), 200);
        }

        return response()->json($query->get(), 200);
    }

    public function store(StoreProductRequest $request)
    {
        $validated = $request->validated();
        $product = Product::create($validated);
        return response()->json(['success' => true, 'product' => $product], 201);
    }

    public function update(UpdateProductRequest $request)
    {
        $validated = $request->validated();
        
        $product = Product::find($validated['id_producto']);
        $product->update($validated);

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