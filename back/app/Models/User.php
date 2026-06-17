<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use Notifiable;

    protected $table = 'usuarios'; // Tu tabla real
    protected $primaryKey = 'id_user'; // Tu clave real

    protected $guarded = [];

    protected $hidden = [
        'password',
    ];
}