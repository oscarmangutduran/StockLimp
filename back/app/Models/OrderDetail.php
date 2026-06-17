<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderDetail extends Model
{
    protected $table = 'detalle_pedido';
    // Al ser una clave compuesta, le indicamos que no tiene una única clave autoincremental
    protected $primaryKey = null;
    public $incrementing = false;
    public $timestamps = false;

    protected $guarded = [];

    public function producto()
    {
        return $this->belongsTo(Product::class, 'id_producto', 'id_producto');
    }
}