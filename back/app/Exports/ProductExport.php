<?php

namespace App\Exports;

use App\Models\Product;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ProductExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return Product::all();
    }

    public function headings(): array
    {
        return ['ID Producto', 'Nombre', 'SKU', 'Es Tóxico', 'Precio Unidad', 'Stock Actual', 'Fecha Registro'];
    }

    public function map($product): array
    {
        return [
            $product->id_producto,
            $product->nombre,
            $product->sku,
            $product->es_toxico ? 'SÍ' : 'NO',
            $product->precio_unidad . '€',
            $product->stock_actual,
            $product->fecha_registro,
        ];
    }
}
