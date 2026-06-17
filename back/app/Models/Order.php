<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $table = 'pedidos';
    protected $primaryKey = 'id_pedido';
    public $timestamps = false;

    protected $guarded = [];

    // Relación para traer los detalles y el usuario que hizo el pedido
    public $with = ['detalles', 'usuario'];

    protected $appends = ['operario'];

    public function detalles()
    {
        return $this->hasMany(OrderDetail::class, 'id_pedido', 'id_pedido');
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    public function getOperarioAttribute()
    {
        return $this->usuario ? $this->usuario->nombre : 'Desconocido';
    }
}