<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductComponent extends Model
{
    protected $table = 'producto_componentes';
    protected $primaryKey = 'id_componente';
    public $timestamps = false;
    protected $guarded = [];

    public function producto()
    {
        return $this->belongsTo(Product::class, 'id_producto', 'id_producto');
    }
}
