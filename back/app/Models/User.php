<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasFactory;

    // Vinculamos explícitamente con tu tabla de la base de datos
    protected $table = 'usuarios';
    
    // Especificamos tu clave primaria personalizada
    protected $primaryKey = 'id_user';
    
    // Desactivamos los timestamps porque tu tabla usa 'fecha_registro' nativa de MySQL
    public $timestamps = false; 

    // Columnas que permitimos rellenar en masa
    protected $fillable = [
        'nombre',
        'email',
        'password',
        'rol',
    ];

    // Columnas que queremos ocultar en las respuestas JSON por seguridad
    protected $hidden = [
        'password',
    ];
}