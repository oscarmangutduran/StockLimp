<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $table = 'pedidos';
    protected $primaryKey = 'id_pedido';
    public $timestamps = false;

    protected $guarded = [];

    // Relación para traer los productos que tiene este pedido
    public $with = ['detalles'];

    public function detalles()
    {
        return $this->hasMany(OrderDetail::class, 'id_pedido', 'id_pedido');
    }
}