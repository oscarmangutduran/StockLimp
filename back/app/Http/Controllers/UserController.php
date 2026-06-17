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

        $isBcrypt = str_starts_with($user->password_hash, '$2y$');
        $passwordMatches = $isBcrypt 
            ? Hash::check($credentials['password'], $user->password_hash) 
            : ($credentials['password'] === $user->password_hash);

        if (!$user || !$passwordMatches) {
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
                'id_user' => $user->id_user,
                'nombre' => $user->nombre,
                'name' => $user->nombre,
                'email' => $user->email,
                'rol' => $user->rol,
                'role' => $user->rol
            ]
        ]);
    }
}