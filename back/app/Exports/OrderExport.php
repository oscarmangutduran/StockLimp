<?php

namespace App\Exports;

use App\Models\Order;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class OrderExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return Order::with('detalles.producto', 'usuario')->orderBy('fecha_creacion', 'desc')->get();
    }

    public function headings(): array
    {
        return ['ID Pedido', 'Operario', 'Fecha Creación', 'Estado', 'Productos', 'Total Pedido'];
    }

    public function map($order): array
    {
        $productosStr = [];
        $total = 0;
        foreach ($order->detalles as $detalle) {
            $prodNombre = $detalle->producto ? $detalle->producto->nombre : 'Desconocido';
            $productosStr[] = "{$prodNombre} (x" . (float)$detalle->cantidad_solicitada . ")";
            $total += (float)$detalle->precio_total_linea;
        }

        return [
            $order->id_pedido,
            $order->operario,
            $order->fecha_creacion,
            $order->estado,
            implode(', ', $productosStr),
            $total . '€',
        ];
    }
}
