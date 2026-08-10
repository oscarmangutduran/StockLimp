<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Vacacion;
use Carbon\Carbon;

class VacacionController extends Controller
{
    private function calcularDiasLaborables($fechaInicio, $fechaFin)
    {
        $inicio = Carbon::parse($fechaInicio);
        $fin = Carbon::parse($fechaFin);
        
        $diasLaborables = 0;
        $current = $inicio->copy();
        
        while ($current->lte($fin)) {
            if ($current->isWeekday()) {
                $diasLaborables++;
            }
            $current->addDay();
        }
        
        return $diasLaborables;
    }

    private function getDiasGastados($id_user)
    {
        $añoActual = Carbon::now()->year;
        
        $vacaciones = Vacacion::where('id_user', $id_user)
            ->whereIn('estado', ['pendiente', 'aprobada'])
            ->whereYear('fecha_inicio', $añoActual)
            ->get();
            
        $diasGastados = 0;
        foreach ($vacaciones as $vac) {
            $diasGastados += $this->calcularDiasLaborables($vac->fecha_inicio, $vac->fecha_fin);
        }
        
        return $diasGastados;
    }

    public function diasDisponibles(Request $request)
    {
        $id_user = $request->query('id_user');
        if (!$id_user) return response()->json(['success' => false, 'message' => 'Falta id_user'], 400);

        $diasGastados = $this->getDiasGastados($id_user);
        $diasDisponibles = max(0, 22 - $diasGastados);

        return response()->json(['success' => true, 'dias_gastados' => $diasGastados, 'dias_disponibles' => $diasDisponibles]);
    }

    public function solicitar(Request $request)
    {
        $request->validate([
            'id_user' => 'required|exists:users,id_user',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
            'comentarios' => 'nullable|string'
        ]);

        $diasGastados = $this->getDiasGastados($request->id_user);
        $diasNuevos = $this->calcularDiasLaborables($request->fecha_inicio, $request->fecha_fin);
        
        if ($diasGastados + $diasNuevos > 22) {
            $disponibles = max(0, 22 - $diasGastados);
            return response()->json([
                'success' => false, 
                'message' => "No puedes solicitar {$diasNuevos} días. Solo te quedan {$disponibles} días laborables disponibles este año."
            ], 400);
        }

        $vacacion = Vacacion::create([
            'id_user' => $request->id_user,
            'fecha_inicio' => $request->fecha_inicio,
            'fecha_fin' => $request->fecha_fin,
            'comentarios' => $request->comentarios,
            'estado' => 'pendiente'
        ]);

        try {
            $userSolicitante = \App\Models\User::find($request->id_user);
            $admins = \App\Models\User::whereIn('rol', ['super_admin', 'admin'])->get();
            foreach ($admins as $admin) {
                \Illuminate\Support\Facades\Mail::to($admin->email)->send(new \App\Mail\VacationRequestedMail($vacacion, $userSolicitante));
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Error enviando correo de vacaciones: " . $e->getMessage());
        }

        return response()->json(['success' => true, 'vacacion' => $vacacion]);
    }

    public function misVacaciones(Request $request)
    {
        $id_user = $request->query('id_user');
        if (!$id_user) return response()->json(['success' => false, 'message' => 'Falta id_user'], 400);

        $vacaciones = Vacacion::where('id_user', $id_user)->orderBy('fecha_inicio', 'desc')->get();
        return response()->json(['success' => true, 'vacaciones' => $vacaciones]);
    }

    public function todas(Request $request)
    {
        $vacaciones = Vacacion::with('user')->orderBy('created_at', 'desc')->get();
        return response()->json(['success' => true, 'vacaciones' => $vacaciones]);
    }

    public function pedirCancelacion(Request $request, $id)
    {
        $request->validate([
            'id_user' => 'required|exists:users,id_user'
        ]);

        $vacacion = Vacacion::where('id_vacacion', $id)->where('id_user', $request->id_user)->first();
        if (!$vacacion) {
            return response()->json(['success' => false, 'message' => 'No encontrada o sin permisos'], 404);
        }

        if ($vacacion->estado === 'pendiente') {
            $vacacion->estado = 'cancelada';
        } else if ($vacacion->estado === 'aprobada') {
            $vacacion->estado = 'solicita_cancelacion';
        } else {
            return response()->json(['success' => false, 'message' => 'No se puede cancelar en este estado'], 400);
        }
        
        $vacacion->save();

        return response()->json(['success' => true, 'vacacion' => $vacacion]);
    }

    public function cambiarEstado(Request $request, $id)
    {
        $request->validate([
            'estado' => 'required|in:aprobada,rechazada,pendiente,cancelada,solicita_cancelacion',
            'id_user_admin' => 'required|exists:users,id_user'
        ]);

        $admin = \App\Models\User::find($request->id_user_admin);
        if (!$admin || !in_array($admin->rol, ['super_admin', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'No tienes permisos para realizar esta acción'], 403);
        }

        $vacacion = Vacacion::find($id);
        if (!$vacacion) {
            return response()->json(['success' => false, 'message' => 'No encontrada'], 404);
        }

        $vacacion->estado = $request->estado;
        $vacacion->save();

        return response()->json(['success' => true, 'vacacion' => $vacacion]);
    }
}
