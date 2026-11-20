<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class AiChatController extends Controller
{
    private function getSystemInstruction(): string
    {
        return implode("\n", [
            'Eres el asistente de soporte de StockLimp (Adarve Limpiezas).',
            'Responde en español de forma clara, amable y muy breve (máximo 2-3 frases salvo que pidan más detalle).',
            'Reglas de StockLimp:',
            '- Contraseña olvidada: marcar "Solicitar restablecimiento de contraseña" en el login o escribir a direccion@adarvelimpiezas.net con asunto "Olvidado".',
            '- Pedidos: los operarios pueden crear/modificar pedidos solo del día 2 al 20 de cada mes.',
            '- Producto faltante en pedido: avisar al repartidor o a administración.',
            '- Vacaciones: se solicitan iniciando sesión en "Vacaciones" (o "Control Horario").',
            '- Fichaje (Control Horario): iniciar, pausar y finalizar jornada desde "Control Horario".',
            '- Roles: super_admin, admin, repartidor y usuario (operario).',
            'No inventes datos internos si no los sabes.',
        ]);
    }

    private function getModelsToTry(): array
    {
        $primaryModel = trim((string) env('GEMINI_MODEL', 'gemini-3.5-flash-lite'));
        if ($primaryModel === '') {
            $primaryModel = 'gemini-3.5-flash-lite';
        }

        return array_values(array_unique([
            $primaryModel,
            'gemini-3.5-flash-lite',
            'gemini-3.1-flash-lite',
            'gemini-3-flash-preview',
        ]));
    }

    private function buildContents(Request $request): array
    {
        $contents = [];
        $history = $request->input('history', []);
        if (is_array($history) && count($history) > 0) {
            // Limitar historial a los últimos 6 mensajes para minimizar tokens y latencia
            $recentHistory = array_slice($history, -6);
            foreach ($recentHistory as $item) {
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

        return $contents;
    }

    private function buildPayload(array $contents): array
    {
        return [
            'system_instruction' => [
                'parts' => [['text' => $this->getSystemInstruction()]],
            ],
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => 0.2,
                'maxOutputTokens' => 200,
                'thinkingConfig' => [
                    'thinkingLevel' => 'minimal',
                ],
            ],
        ];
    }

    private function getCacheKey(Request $request): ?string
    {
        $history = $request->input('history', []);
        if (is_array($history) && count($history) > 0) {
            return null;
        }
        $normalized = mb_strtolower(preg_replace('/\s+/', ' ', trim((string) $request->input('message'))));
        return 'ai_chat_v2_' . sha1($normalized);
    }

    /**
     * Endpoint JSON optimizado del agente de IA conectado a Google AI Studio (Gemini API).
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

        $cacheKey = $this->getCacheKey($request);
        if ($cacheKey !== null) {
            try {
                $cached = Cache::get($cacheKey);
                if (is_array($cached) && !empty($cached['reply'])) {
                    return response()->json([
                        'success' => true,
                        'reply' => $cached['reply'],
                        'model' => $cached['model'] ?? 'cache',
                        'cached' => true,
                    ]);
                }
            } catch (\Throwable $e) {
                // Continuar sin caché si hay error de almacenamiento
            }
        }

        $modelsToTry = $this->getModelsToTry();
        $payload = $this->buildPayload($this->buildContents($request));
        $lastError = 'No se pudo obtener respuesta del modelo de IA.';

        foreach ($modelsToTry as $model) {
            $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$apiKey}";

            try {
                $response = Http::connectTimeout(3)
                    ->timeout(6)
                    ->withHeaders([
                        'Expect' => '',
                    ])
                    ->withOptions([
                        'curl' => [
                            CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
                        ],
                    ])
                    ->post($endpoint, $payload);

                if ($response->successful()) {
                    $reply = $response->json('candidates.0.content.parts.0.text');
                    if ($reply) {
                        $cleanReply = trim($reply);
                        if ($cacheKey !== null) {
                            try {
                                Cache::put($cacheKey, ['reply' => $cleanReply, 'model' => $model], now()->addMinutes(10));
                            } catch (\Throwable $e) {
                                // Ignorar fallo de caché
                            }
                        }

                        return response()->json([
                            'success' => true,
                            'reply' => $cleanReply,
                            'model' => $model,
                        ]);
                    }
                }

                $status = $response->status();
                $lastError = $response->json('error.message') ?? 'Error al comunicarse con Google AI Studio.';

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

    /**
     * Endpoint de streaming SSE para mostrar la respuesta en tiempo real mientras se genera.
     */
    public function chatStream(Request $request)
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

        $cacheKey = $this->getCacheKey($request);
        $modelsToTry = $this->getModelsToTry();
        $payload = $this->buildPayload($this->buildContents($request));

        return response()->stream(function () use ($apiKey, $cacheKey, $modelsToTry, $payload) {
            while (ob_get_level() > 0) {
                @ob_end_flush();
            }

            $sendEvent = function (array $data): void {
                echo 'data: ' . json_encode($data, JSON_UNESCAPED_UNICODE) . "\n\n";
                @flush();
            };

            // Respuesta instantánea desde caché para preguntas frecuentes sin historial
            if ($cacheKey !== null) {
                try {
                    $cached = Cache::get($cacheKey);
                    if (is_array($cached) && !empty($cached['reply'])) {
                        $sendEvent(['chunk' => $cached['reply']]);
                        $sendEvent(['done' => true, 'model' => $cached['model'] ?? 'cache', 'cached' => true]);
                        return;
                    }
                } catch (\Throwable $e) {
                    // Continuar sin caché
                }
            }

            $jsonPayload = json_encode($payload, JSON_UNESCAPED_UNICODE);
            $lastError = 'No se pudo obtener respuesta del modelo de IA.';

            foreach ($modelsToTry as $model) {
                $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:streamGenerateContent?alt=sse&key={$apiKey}";
                $buffer = '';
                $fullReply = '';
                $sentAnyChunk = false;
                $rawBody = '';

                $ch = curl_init($endpoint);
                curl_setopt_array($ch, [
                    CURLOPT_POST => true,
                    CURLOPT_POSTFIELDS => $jsonPayload,
                    CURLOPT_HTTPHEADER => [
                        'Content-Type: application/json',
                        'Expect:',
                    ],
                    CURLOPT_IPRESOLVE => CURL_IPRESOLVE_V4,
                    CURLOPT_CONNECTTIMEOUT => 3,
                    CURLOPT_LOW_SPEED_LIMIT => 1,
                    CURLOPT_LOW_SPEED_TIME => 5,
                    CURLOPT_TIMEOUT => 12,
                    CURLOPT_WRITEFUNCTION => function ($ch, $data) use (&$buffer, &$fullReply, &$sentAnyChunk, &$rawBody, $sendEvent) {
                        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                        if ($httpCode >= 400) {
                            $rawBody .= $data;
                            return strlen($data);
                        }

                        $buffer .= $data;
                        while (($pos = strpos($buffer, "\n")) !== false) {
                            $line = trim(substr($buffer, 0, $pos));
                            $buffer = substr($buffer, $pos + 1);

                            if (!str_starts_with($line, 'data:')) {
                                continue;
                            }

                            $jsonStr = trim(substr($line, 5));
                            if ($jsonStr === '' || $jsonStr === '[DONE]') {
                                continue;
                            }

                            $decoded = json_decode($jsonStr, true);
                            $text = $decoded['candidates'][0]['content']['parts'][0]['text'] ?? null;
                            if (is_string($text) && $text !== '') {
                                $fullReply .= $text;
                                $sentAnyChunk = true;
                                $sendEvent(['chunk' => $text]);
                            }
                        }

                        return strlen($data);
                    },
                ]);

                curl_exec($ch);
                $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $curlErr = curl_error($ch);
                curl_close($ch);

                if ($sentAnyChunk) {
                    $cleanReply = trim($fullReply);
                    if ($cacheKey !== null && $cleanReply !== '') {
                        try {
                            Cache::put($cacheKey, ['reply' => $cleanReply, 'model' => $model], now()->addMinutes(10));
                        } catch (\Throwable $e) {
                            // Ignorar fallo de caché
                        }
                    }
                    $sendEvent(['done' => true, 'model' => $model]);
                    return;
                }

                if ($rawBody !== '') {
                    $errJson = json_decode($rawBody, true);
                    $lastError = $errJson['error']['message'] ?? 'Error al comunicarse con Google AI Studio.';
                } elseif ($curlErr !== '') {
                    $lastError = 'Error de conexión con Google AI Studio.';
                }

                if (!in_array($status, [0, 400, 404, 429, 500, 503], true)) {
                    break;
                }
            }

            $sendEvent(['error' => $lastError]);
        }, 200, [
            'Content-Type' => 'text/event-stream; charset=utf-8',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }
}
