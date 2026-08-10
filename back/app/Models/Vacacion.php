<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vacacion extends Model
{
    use HasFactory;

    protected $table = 'vacaciones';
    protected $primaryKey = 'id_vacacion';

    protected $fillable = [
        'id_user',
        'fecha_inicio',
        'fecha_fin',
        'estado',
        'comentarios',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }
}
