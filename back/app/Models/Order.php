<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    // Vinculamos con tu tabla de pedidos
    protected $table = 'pedidos';
    
    // Clave primaria de tu script SQL
    protected $primaryKey = 'id_pedido';
    
    // Desactivamos created_at y updated_at
    public $timestamps = false;

    protected $fillable = [
        'id_user',
        'fecha_pedido',
        'estado',
    ];

    // Con esta propiedad le decimos a Laravel que cargue siempre la relación 'usuario' de forma automática
    public $with = ['usuario'];

    /**
     * Relación: Un pedido pertenece a un usuario (operario)
     */
    public function usuario()
    {
        // Enlazamos id_user local con el id_user de la tabla usuarios
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }
}