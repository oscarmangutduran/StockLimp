<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Fichaje;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class TimeTrackingController extends Controller
{
    // Obtener estado actual del usuario
    public function actual(Request $request)
    {
        $id_user = $request->input('id_user');
        if (!$id_user) return response()->json(['success' => false, 'message' => 'Falta id_user'], 400);

        $fichajeActivo = Fichaje::where('id_user', $id_user)
            ->whereIn('estado', ['trabajando', 'en_pausa'])
            ->orderBy('id', 'desc')
            ->first();

        if ($fichajeActivo) {
            return response()->json([
                'success' => true,
                'activo' => true,
                'fichaje' => $fichajeActivo
            ]);
        }

        return response()->json([
            'success' => true,
            'activo' => false
        ]);
    }

    // Iniciar turno (Play)
    public function iniciar(Request $request)
    {
        $id_user = $request->input('id_user');
        
        // Comprobar si ya tiene uno activo
        $activo = Fichaje::where('id_user', $id_user)->whereIn('estado', ['trabajando', 'en_pausa'])->first();
        if ($activo) {
            return response()->json(['success' => false, 'message' => 'Ya hay un turno activo.']);
        }

        $fichaje = Fichaje::create([
            'id_user' => $id_user,
            'estado' => 'trabajando',
            'hora_entrada' => Carbon::now(),
        ]);

        return response()->json(['success' => true, 'fichaje' => $fichaje]);
    }

    // Pausar turno
    public function pausar(Request $request)
    {
        $id_user = $request->input('id_user');
        
        $activo = Fichaje::where('id_user', $id_user)->whereIn('estado', ['trabajando', 'en_pausa'])->orderBy('id', 'desc')->first();
        if (!$activo) {
            return response()->json(['success' => false, 'message' => 'No hay turno activo para pausar o reanudar.']);
        }

        if ($activo->estado === 'trabajando') {
            $activo->estado = 'en_pausa';
        } else {
            $activo->estado = 'trabajando';
        }
        $activo->save();

        return response()->json(['success' => true, 'fichaje' => $activo]);
    }

    // Finalizar turno (Stop) con comentarios y documentos
    public function finalizar(Request $request)
    {
        $id_user = $request->input('id_user');
        $comentarios = $request->input('comentarios');
        
        $activo = Fichaje::where('id_user', $id_user)->whereIn('estado', ['trabajando', 'en_pausa'])->orderBy('id', 'desc')->first();
        if (!$activo) {
            return response()->json(['success' => false, 'message' => 'No hay turno activo para finalizar.']);
        }

        $documentoPath = null;
        if ($request->hasFile('documento')) {
            $file = $request->file('documento');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('public/justificantes', $filename);
            $documentoPath = Storage::url($path);
        }

        $activo->estado = 'finalizado';
        $activo->hora_salida = Carbon::now();
        $activo->comentarios = $comentarios;
        if ($documentoPath) {
            $activo->documento_path = $documentoPath;
        }
        $activo->save();

        return response()->json(['success' => true, 'fichaje' => $activo]);
    }
}
