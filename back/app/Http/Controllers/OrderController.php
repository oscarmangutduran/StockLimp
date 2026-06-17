<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderDetail;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index()
    {
        // Traemos los pedidos cargando los detalles y el producto asociado a cada detalle
        $pedidos = Order::with('detalles.producto')->orderBy('fecha_creacion', 'desc')->get();
        return response()->json($pedidos, 200);
    }

    public function storeMultiple(Request $request)
    {
        $request->validate([
            'id_user' => 'required|exists:users,id_user',
            'productos' => 'required|array', // Array de objetos con id_producto y cantidad
        ]);

        // Usamos una transacción para asegurarnos de que si falla un detalle, no se cree el pedido a medias
        DB::transaction(function () use ($request) {
            $pedido = Order::create([
                'id_user' => $request->id_user,
                'id_centro' => 1, // Centro predeterminado para cumplir con la restricción de clave foránea
                'fecha_creacion' => now()->format('Y-m-d H:i:s'),
                'estado' => 'PENDIENTE'
            ]);

            foreach ($request->productos as $item) {
                $product = \App\Models\Product::find($item['id_producto']);
                $precio_total = $product ? ($product->precio_unidad * $item['cantidad']) : 0;

                OrderDetail::create([
                    'id_pedido' => $pedido->id_pedido,
                    'id_producto' => $item['id_producto'],
                    'cantidad_solicitada' => $item['cantidad'],
                    'precio_total_linea' => $precio_total
                ]);
            }
        });

        return response()->json(['success' => true, 'message' => 'Pedido registrado correctamente'], 201);
    }

    public function updateStatus(Request $request)
    {
        $request->validate([
            'id_pedido' => 'required|exists:pedidos,id_pedido',
            'estado' => 'required|string'
        ]);

        $order = Order::find($request->id_pedido);
        $order->update(['estado' => strtoupper($request->estado)]);

        return response()->json(['success' => true, 'order' => $order], 200);
    }

    public function exportarExcel()
    {
        $raw = \Maatwebsite\Excel\Facades\Excel::raw(new \App\Exports\OrderExport, \Maatwebsite\Excel\Excel::XLSX);
        return response($raw, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => 'attachment; filename="pedidos.xlsx"',
        ]);
    }

    public function destroy(Request $request)
    {
        $request->validate(['id_pedido' => 'required|exists:pedidos,id_pedido']);
        Order::destroy($request->id_pedido);

        return response()->json(['success' => true, 'message' => 'Pedido eliminado'], 200);
    }
}