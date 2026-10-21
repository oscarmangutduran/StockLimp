<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\User;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateWithApiToken
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $strict = 'optional'): Response
    {
        $token = $request->bearerToken() 
            ?? $request->header('X-Auth-Token') 
            ?? $request->input('api_token');

        if ($token) {
            $user = User::where('api_token', $token)->first();

            if ($user && $user->estado === 'activo') {
                $request->setUserResolver(fn () => $user);
                $request->attributes->set('authenticated_user', $user);
            } elseif ($strict === 'strict') {
                return response()->json([
                    'success' => false,
                    'message' => 'Token de autenticación inválido o usuario inactivo.'
                ], 401);
            }
        } elseif ($strict === 'strict') {
            return response()->json([
                'success' => false,
                'message' => 'Acceso no autorizado. Se requiere un token de autenticación Bearer.'
            ], 401);
        }

        return $next($request);
    }
}
