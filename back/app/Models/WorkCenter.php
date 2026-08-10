<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkCenter extends Model
{
    protected $table = 'centros_trabajo';
    protected $primaryKey = 'id_centro';
    public $timestamps = false;

    protected $guarded = [];

    // Mapear automáticamente nombre_centro a nombre para el frontend
    protected $appends = ['nombre'];
    protected $hidden = ['nombre_centro'];

    public function getNombreAttribute()
    {
        return $this->nombre_centro;
    }

    public function setNombreAttribute($value)
    {
        $this->attributes['nombre_centro'] = $value;
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'centro_user', 'id_centro', 'id_user');
    }
}
