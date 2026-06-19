<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderDetail;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with('detalles.producto');
        
        if ($request->has('id_user')) {
            $query->where('id_user', $request->input('id_user'));
        }

        $pedidos = $query->orderBy('fecha_creacion', 'desc')->get();
        return response()->json($pedidos, 200);
    }

    public function storeMultiple(Request $request)
    {
        $request->validate([
            'id_user' => 'required|exists:users,id_user',
            'productos' => 'required|array', // Array de objetos con id_producto y cantidad
            'observaciones' => 'nullable|string',
        ]);

        // Usamos una transacción para asegurarnos de que si falla un detalle, no se cree el pedido a medias
        DB::transaction(function () use ($request) {
            $pedido = Order::create([
                'id_user' => $request->id_user,
                'id_centro' => 1, // Centro predeterminado para cumplir con la restricción de clave foránea
                'fecha_creacion' => now()->format('Y-m-d H:i:s'),
                'estado' => 'PENDIENTE',
                'observaciones' => $request->observaciones
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

        $order = Order::with('usuario', 'centro')->find($request->id_pedido);
        $order->update(['estado' => strtoupper($request->estado)]);

        // Si el usuario es de rol 'usuario', enviar correo
        if ($order->usuario && $order->usuario->rol === 'usuario') {
            try {
                \Illuminate\Support\Facades\Mail::to($order->usuario->email)->send(new \App\Mail\OrderStatusUpdated($order));
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("Error enviando correo de cambio de estado: " . $e->getMessage());
            }
        }

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

    public function updateDetails(Request $request)
    {
        $request->validate([
            'id_pedido' => 'required|exists:pedidos,id_pedido',
            'id_user' => 'required|exists:users,id_user',
            'productos' => 'required|array', // Array de objetos con id_producto y cantidad
            'observaciones' => 'nullable|string',
        ]);

        $user = \App\Models\User::find($request->id_user);
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Usuario no encontrado'], 404);
        }

        // Restricción de fecha del 2 al 8 para rol usuario
        if ($user->rol === 'usuario' && !$request->input('force_period')) {
            $day = (int)date('j');
            if ($day < 2 || $day > 8) {
                return response()->json([
                    'success' => false,
                    'message' => 'Solo se pueden modificar los pedidos entre los días 2 y 8 del mes en curso.'
                ], 403);
            }
        }

        $pedido = Order::find($request->id_pedido);
        if (!$pedido) {
            return response()->json(['success' => false, 'message' => 'Pedido no encontrado'], 404);
        }

        // Verificar que el pedido pertenece al usuario si es rol usuario
        if ($user->rol === 'usuario' && $pedido->id_user != $user->id_user) {
            return response()->json(['success' => false, 'message' => 'No tienes permiso para modificar este pedido.'], 403);
        }

        // Usamos una transacción para asegurarnos de que si falla un detalle, no se cree el pedido a medias
        DB::transaction(function () use ($pedido, $request) {
            // Actualizar observaciones
            $pedido->update([
                'observaciones' => $request->input('observaciones')
            ]);

            // Eliminar detalles anteriores
            OrderDetail::where('id_pedido', $pedido->id_pedido)->delete();

            // Insertar nuevos detalles
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

        return response()->json(['success' => true, 'message' => 'Pedido modificado correctamente'], 200);
    }

    public function updateMultipleStatus(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:pedidos,id_pedido',
            'estado' => 'required|string'
        ]);

        $estadoUpper = strtoupper($request->estado);

        // Actualizar en base de datos
        Order::whereIn('id_pedido', $request->ids)->update(['estado' => $estadoUpper]);

        // Cargar los pedidos actualizados para enviar los correos
        $orders = Order::with('usuario', 'centro')->whereIn('id_pedido', $request->ids)->get();

        foreach ($orders as $order) {
            if ($order->usuario && $order->usuario->rol === 'usuario') {
                try {
                    \Illuminate\Support\Facades\Mail::to($order->usuario->email)->send(new \App\Mail\OrderStatusUpdated($order));
                } catch (\Exception $e) {
                    \Illuminate\Support\Facades\Log::error("Error enviando correo de cambio de estado masivo: " . $e->getMessage());
                }
            }
        }

        return response()->json(['success' => true, 'message' => 'Pedidos actualizados correctamente'], 200);
    }
}