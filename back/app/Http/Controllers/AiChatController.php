<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AiChatController extends Controller
{
    /**
     * Endpoint del agente de IA conectado a Google AI Studio (Gemini API).
     */
    public function chat(Request $request)
    {
        @set_time_limit(60);

        $request->validate([
            'message' => 'required|string|max:2000',
            'history' => 'nullable|array|max:20',
        ]);

        $apiKey = trim((string) env('GEMINI_API_KEY', ''));
        if ($apiKey === '') {
            return response()->json([
                'success' => false,
                'message' => 'Falta configurar GEMINI_API_KEY en el archivo .env del backend.',
            ], 503);
        }

        $primaryModel = trim((string) env('GEMINI_MODEL', 'gemini-3.1-flash-lite'));
        if ($primaryModel === '') {
            $primaryModel = 'gemini-3.1-flash-lite';
        }

        $modelsToTry = array_values(array_unique([
            $primaryModel,
            'gemini-3.1-flash-lite',
            'gemini-3.5-flash-lite',
            'gemini-3-flash-preview',
        ]));

        $systemInstruction = implode("\n", [
            'Eres el asistente de soporte inteligente de StockLimp (Adarve Limpiezas).',
            'Responde siempre en español, de forma amable, clara, directa y útil.',
            'Reglas de negocio de StockLimp que debes conocer:',
            '- Contraseña olvidada: el usuario puede marcar la casilla "Solicitar restablecimiento de contraseña" en la pantalla de inicio de sesión o escribir a direccion@adarvelimpiezas.net con el asunto "Olvidado".',
            '- Pedidos de material: los operarios pueden crear y modificar sus pedidos únicamente del día 2 al día 20 de cada mes.',
            '- Falta de un producto en un pedido: debe avisar a la persona encargada de entregar el pedido (repartidor) o a administración.',
            '- Vacaciones: se solicitan una vez iniciada sesión desde la sección "Vacaciones" (o "Control Horario").',
            '- Control Horario (fichaje): una vez iniciada sesión, el trabajador puede iniciar, pausar y finalizar su jornada en la sección "Control Horario".',
            '- Roles del sistema: super_admin, admin, repartidor y usuario (operario).',
            'Si te preguntan algo fuera de StockLimp o que no sepas con certeza, responde con honestidad sin inventar datos internos de la empresa.',
        ]);

        $contents = [];
        $history = $request->input('history', []);
        if (is_array($history)) {
            foreach ($history as $item) {
                $role = ($item['role'] ?? '') === 'model' ? 'model' : 'user';
                $text = trim((string) ($item['text'] ?? ''));
                if ($text !== '') {
                    $contents[] = [
                        'role' => $role,
                        'parts' => [['text' => $text]],
                    ];
                }
            }
        }

        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => trim((string) $request->input('message'))]],
        ];

        $lastError = 'No se pudo obtener respuesta del modelo de IA.';

        foreach ($modelsToTry as $model) {
            $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

            try {
                $response = Http::connectTimeout(5)
                    ->timeout(10)
                    ->withHeaders([
                        'Expect' => '',
                    ])
                    ->withOptions([
                        'curl' => [
                            CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
                            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
                        ],
                    ])
                    ->post($endpoint, [
                        'system_instruction' => [
                            'parts' => [['text' => $systemInstruction]],
                        ],
                        'contents' => $contents,
                        'generationConfig' => [
                            'temperature' => 0.3,
                            'maxOutputTokens' => 300,
                            'thinkingConfig' => [
                                'thinkingBudget' => 0,
                            ],
                        ],
                    ]);

                if ($response->successful()) {
                    $reply = $response->json('candidates.0.content.parts.0.text');
                    if ($reply) {
                        return response()->json([
                            'success' => true,
                            'reply' => trim($reply),
                            'model' => $model,
                        ]);
                    }
                }

                $status = $response->status();
                $lastError = $response->json('error.message') ?? 'Error al comunicarse con Google AI Studio.';

                // Si el modelo está saturado (503/429) o no disponible (404/400), probamos el siguiente modelo
                if (!in_array($status, [400, 404, 429, 500, 503], true)) {
                    break;
                }
            } catch (\Throwable $e) {
                $lastError = 'Error de conexión con Google AI Studio.';
            }
        }

        return response()->json([
            'success' => false,
            'message' => $lastError,
        ], 502);
    }
}
