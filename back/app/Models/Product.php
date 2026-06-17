<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    protected $table = 'productos';
    protected $primaryKey = 'id_producto';
    
    // Como tu SQL no tiene las columnas 'created_at' y 'updated_at', desactivamos el timestamp automático de Laravel
    public $timestamps = false; 

    protected $guarded = [];
}