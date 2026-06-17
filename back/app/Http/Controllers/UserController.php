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

    public function index()
    {
        return response()->json(User::all(), 200);
    }

    public function updateRole(Request $request)
    {
        $request->validate([
            'id_user' => 'required|exists:users,id_user',
            'rol' => 'required|in:super_admin,admin,usuario',
        ]);

        $user = User::find($request->id_user);
        $user->rol = $request->rol;
        $user->save();

        return response()->json(['success' => true, 'user' => $user], 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:4',
            'rol' => 'required|in:super_admin,admin,usuario',
        ]);

        $user = User::create([
            'nombre' => $request->nombre,
            'email' => $request->email,
            'password_hash' => \Illuminate\Support\Facades\Hash::make($request->password),
            'rol' => $request->rol,
            'fecha_creacion' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Usuario creado correctamente.',
            'user' => $user
        ], 201);
    }
}