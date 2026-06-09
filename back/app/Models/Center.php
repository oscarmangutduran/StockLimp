<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Center extends Model
{
    // Vinculamos con tu tabla de centros de trabajo
    protected $table = 'centros_trabajo';
    
    // Clave primaria de tu script SQL
    protected $primaryKey = 'id_centro';
    
    // Desactivamos created_at y updated_at
    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'direccion',
        'ciudad',
    ];
}