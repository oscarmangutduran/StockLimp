<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    protected $table = 'users'; // Tu tabla real
    protected $primaryKey = 'id_user'; // Tu clave real
    public $timestamps = false;

    protected $guarded = [];

    protected $hidden = [
        'password_hash',
    ];

    public $with = ['centro', 'centros'];

    public function centro()
    {
        return $this->belongsTo(WorkCenter::class, 'id_centro', 'id_centro');
    }

    public function centros()
    {
        return $this->belongsToMany(WorkCenter::class, 'centro_user', 'id_user', 'id_centro');
    }
}