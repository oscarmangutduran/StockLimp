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
        $pedidos = Order::with('detalles.producto')->orderBy('fecha_pedido', 'desc')->get();
        return response()->json($pedidos, 200);
    }

    public function storeMultiple(Request $request)
    {
        $request->validate([
            'id_user' => 'required|exists:usuarios,id_user',
            'productos' => 'required|array', // Array de objetos con id_producto y cantidad
        ]);

        // Usamos una transacción para asegurarnos de que si falla un detalle, no se cree el pedido a medias
        DB::transaction(function () use ($request) {
            $pedido = Order::create([
                'id_user' => $request->id_user,
                'fecha_pedido' => now()->format('Y-m-d H:i:s'),
                'estado' => 'PENDIENTE'
            ]);

            foreach ($request->productos as $item) {
                OrderDetail::create([
                    'id_pedido' => $pedido->id_pedido,
                    'id_producto' => $item['id_producto'],
                    'cantidad' => $item['cantidad']
                ]);
            }
        ]);

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
}