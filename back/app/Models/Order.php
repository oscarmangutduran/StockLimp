<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $table = 'pedidos';
    protected $primaryKey = 'id_pedido';
    public $timestamps = false;

    protected $guarded = [];

    // Relación para traer los detalles, el usuario y el centro
    public $with = ['detalles', 'usuario', 'centro'];

    protected $appends = ['operario'];

    public function detalles()
    {
        return $this->hasMany(OrderDetail::class, 'id_pedido', 'id_pedido');
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    public function centro()
    {
        return $this->belongsTo(WorkCenter::class, 'id_centro', 'id_centro');
    }

    public function getOperarioAttribute()
    {
        return $this->usuario ? $this->usuario->nombre : 'Desconocido';
    }
}