<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    // Obtener el listado de pedidos mapeando el nombre del operario de forma automática
    public function index() {
        $pedidos = Order::orderBy('id_pedido', 'desc')->get()->map(function($pedido) {
            return [
                'id_pedido' => $pedido->id_pedido,
                'id_user' => $pedido->id_user,
                'fecha_pedido' => $pedido->fecha_pedido,
                'estado' => $pedido->estado,
                'operario' => $pedido->usuario ? $pedido->usuario->nombre : 'Desconocido'
            ];
        ]);
        return response()->json($pedidos);
    }

    // Crear un pedido y todo su desglose de productos a la vez
    public function storeMultiple(Request $request) {
        try {
            DB::transaction(function () use ($request) {
                // 1. Insertamos la cabecera del pedido en la tabla 'pedidos'
                $id_pedido = DB::table('pedidos')->insertGetId([
                    'id_user' => $request->input('id_user'),
                    'estado' => 'PENDIENTE',
                    'fecha_pedido' => now()
                ]);

                // 2. Insertamos el desglose en la tabla 'detalle_pedido'
                $productos = $request->input('productos', []);
                foreach ($productos as $prod) {
                    DB::table('detalle_pedido')->insert([
                        'id_pedido' => $id_pedido,
                        'id_producto' => $prod['id_producto'],
                        'cantidad' => $prod['cantidad']
                    ]);
                }
            ]);
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'error' => $e->getMessage()]);
        }
    }

    // Cambiar el estado del pedido (Aprobado, Pendiente, Rechazado)
    public function updateStatus(Request $request) {
        $pedido = Order::find($request->input('id_pedido'));
        if ($pedido) {
            $res = $pedido->update([
                'estado' => $request->input('estado'),
                'fecha_pedido' => $request->input('fecha_pedido')
            ]);
            return response()->json(['success' => $res]);
        }
        return response()->json(['success' => false]);
    }
}