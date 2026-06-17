<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $credentials['email'])->first();

        // Tu SQL usa hashes de Bcrypt ($2y$10$...), así que Hash::check funcionará a la perfección
        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Las credenciales no coinciden con nuestros registros.'
            ], 401);
        }

        return response()->json([
            'success' => true,
            'message' => 'Login correcto',
            'user' => [
                'id' => $user->id_user,
                'name' => $user->nombre,
                'email' => $user->email,
                'role' => $user->rol
            ]
        ]);
    }
}