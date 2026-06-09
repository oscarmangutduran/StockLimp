<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function login(Request $request)
    {
        $email = $request->input('email');
        $password = $request->input('password');

        if (empty($email) || empty($password)) {
            return response()->json(['success' => false, 'message' => 'Faltan datos obligatorios.'], 400);
        }

        // Buscamos al usuario por su email
        $user = User::where('email', $email)->first();

        if ($user) {
            // Comprobación híbrida segura: texto plano OR Hash de Laravel (Bcrypt)
            if ($password === $user->password || Hash::check($password, $user->password)) {
                return response()->json([
                    'success' => true,
                    'user' => [
                        'id_user' => $user->id_user,
                        'nombre' => $user->nombre,
                        'email' => $user->email,
                        'rol' => $user->rol
                    ]
                ]);
            }
        }

        return response()->json(['success' => false, 'message' => 'Credenciales incorrectas.'], 200);
    }
}