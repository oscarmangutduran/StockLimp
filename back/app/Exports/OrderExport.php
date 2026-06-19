<?php

namespace App\Exports;

use App\Models\Order;
use App\Models\Product;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class OrderExport implements FromCollection, WithHeadings, WithMapping
{
    protected $products;

    public function __construct()
    {
        // Cargamos todos los productos de la base de datos para generar las columnas dinámicas
        $this->products = Product::orderBy('id_producto')->get();
    }

    public function collection()
    {
        return Order::with('detalles.producto', 'usuario')->orderBy('fecha_creacion', 'desc')->get();
    }

    public function headings(): array
    {
        $headers = ['ID Pedido', 'Operario', 'Fecha Creación', 'Estado', 'Observaciones', 'Número de Ruta'];
        foreach ($this->products as $product) {
            $headers[] = $product->nombre;
        }
        return $headers;
    }

    public function map($order): array
    {
        $row = [
            $order->id_pedido,
            $order->operario,
            $order->fecha_creacion,
            $order->estado,
            $order->observaciones,
            $order->numero_ruta,
        ];

        // Mapear id_producto -> cantidad para este pedido
        $quantities = [];
        foreach ($order->detalles as $detalle) {
            $quantities[$detalle->id_producto] = (float)$detalle->cantidad_solicitada;
        }

        // Agregar la cantidad para cada columna de producto
        foreach ($this->products as $product) {
            $row[] = $quantities[$product->id_producto] ?? 0;
        }

        return $row;
    }
}
