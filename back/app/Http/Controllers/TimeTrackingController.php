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

        $semanaInicio = Carbon::now()->startOfWeek();

        $fichajesSemanaFinalizados = Fichaje::where('id_user', $id_user)
            ->where('estado', 'finalizado')
            ->where('hora_entrada', '>=', $semanaInicio)
            ->whereNotNull('hora_salida')
            ->get();

        $segundosSemana = 0;
        foreach ($fichajesSemanaFinalizados as $f) {
            $segundosSemana += max(0, Carbon::parse($f->hora_entrada)->diffInSeconds(Carbon::parse($f->hora_salida)));
        }

        // Objetivo semanal estándar: 40 horas (144000s)
        $objetivoSemanaSegundos = 40 * 3600;

        $resumen = [
            'objetivo_semana_segundos' => $objetivoSemanaSegundos,
            'realizados_semana_segundos' => $segundosSemana,
        ];

        if ($fichajeActivo) {
            return response()->json([
                'success' => true,
                'activo' => true,
                'fichaje' => $fichajeActivo,
                'resumen' => $resumen,
            ]);
        }

        return response()->json([
            'success' => true,
            'activo' => false,
            'resumen' => $resumen,
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

    // Pausar o reanudar turno (con comentarios y documento opcionales)
    public function pausar(Request $request)
    {
        $id_user = $request->input('id_user');
        $comentarios = $request->input('comentarios');

        $activo = Fichaje::where('id_user', $id_user)->whereIn('estado', ['trabajando', 'en_pausa'])->orderBy('id', 'desc')->first();
        if (!$activo) {
            return response()->json(['success' => false, 'message' => 'No hay turno activo para pausar o reanudar.']);
        }

        if ($request->hasFile('documento')) {
            $file = $request->file('documento');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('public/justificantes', $filename);
            $activo->documento_path = Storage::url($path);
        }

        if ($comentarios !== null && trim($comentarios) !== '') {
            $activo->comentarios = $activo->comentarios
                ? $activo->comentarios . "\n[Pausa] " . trim($comentarios)
                : '[Pausa] ' . trim($comentarios);
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

    /**
     * Obtener resumen semanal de horas trabajadas de un usuario.
     */
    public function porUsuario(Request $request, $id_user)
    {
        if (!$id_user) {
            return response()->json(['success' => false, 'message' => 'Falta id_user'], 400);
        }

        $query = Fichaje::where('id_user', $id_user)
            ->whereNotNull('hora_entrada')
            ->orderBy('hora_entrada', 'desc');

        if ($request->filled('fecha_desde')) {
            $query->whereDate('hora_entrada', '>=', $request->input('fecha_desde'));
        }
        if ($request->filled('fecha_hasta')) {
            $query->whereDate('hora_entrada', '<=', $request->input('fecha_hasta'));
        }

        $fichajes = $query->get();

        // Jornada semanal estipulada por defecto: 40 horas
        $jornadaHoras = (float) $request->input('jornada_horas', 40);
        $jornadaSegundos = max(0, $jornadaHoras * 3600);

        $porSemana = [];
        foreach ($fichajes as $f) {
            $entrada = Carbon::parse($f->hora_entrada);
            $inicioSemana = $entrada->copy()->startOfWeek(Carbon::MONDAY);
            $finSemana = $entrada->copy()->endOfWeek(Carbon::SUNDAY);
            $semanaKey = $inicioSemana->format('Y-m-d');
            $fechaDia = $entrada->format('Y-m-d');

            if (!isset($porSemana[$semanaKey])) {
                $porSemana[$semanaKey] = [
                    'semana_key' => $semanaKey,
                    'fecha_inicio' => $inicioSemana->format('Y-m-d'),
                    'fecha_fin' => $finSemana->format('Y-m-d'),
                    'segundos_trabajados' => 0,
                    'num_fichajes' => 0,
                    'en_curso' => false,
                    '_dias' => [],
                ];
            }

            $porSemana[$semanaKey]['num_fichajes']++;
            $porSemana[$semanaKey]['_dias'][$fechaDia] = true;

            if ($f->hora_salida) {
                $salida = Carbon::parse($f->hora_salida);
                $porSemana[$semanaKey]['segundos_trabajados'] += max(0, $entrada->diffInSeconds($salida));
            } elseif (in_array($f->estado, ['trabajando', 'en_pausa'], true)) {
                $porSemana[$semanaKey]['segundos_trabajados'] += max(0, $entrada->diffInSeconds(Carbon::now()));
                $porSemana[$semanaKey]['en_curso'] = true;
            }
        }

        $semanas = [];
        foreach ($porSemana as $item) {
            $segs = (int) $item['segundos_trabajados'];
            $semanas[] = [
                'semana_key' => $item['semana_key'],
                'fecha_inicio' => $item['fecha_inicio'],
                'fecha_fin' => $item['fecha_fin'],
                'segundos_trabajados' => $segs,
                'dias_trabajados' => count($item['_dias']),
                'num_fichajes' => $item['num_fichajes'],
                'en_curso' => $item['en_curso'],
                'cumple_jornada' => $segs >= $jornadaSegundos,
            ];
        }

        return response()->json([
            'success' => true,
            'jornada_estipulada_horas' => $jornadaHoras,
            'semanas' => $semanas,
        ]);
    }
}
