<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Fichaje extends Model
{
    use HasFactory;

    protected $table = 'fichajes';

    protected $fillable = [
        'id_user',
        'estado',
        'hora_entrada',
        'hora_salida',
        'comentarios',
        'documento_path',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }
}
