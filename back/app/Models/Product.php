<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    // Vinculamos con tu tabla de productos
    protected $table = 'productos';
    
    // Clave primaria de tu script SQL
    protected $primaryKey = 'id_producto';
    
    // Desactivamos created_at y updated_at
    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'sku',
        'es_toxico',
        'precio_unidad',
        'stock_actual',
    ];
}