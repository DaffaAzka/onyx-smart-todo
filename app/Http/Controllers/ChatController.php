<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('chat', [
            'model' => config('services.groq.model'),
        ]);
    }

    public function send(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'messages' => ['required', 'array', 'min:1'],
            'messages.*.role' => ['required', 'string', 'in:system,user,assistant'],
            'messages.*.content' => ['required', 'string', 'max:10000'],
        ]);

        $apiKey = config('services.groq.key');
        $baseUrl = rtrim((string) config('services.groq.base_url'), '/');
        $model = config('services.groq.model');

        if (empty($apiKey)) {
            return response()->json([
                'error' => 'Groq API key is not configured.',
            ], 500);
        }

        try {
            $response = Http::withToken($apiKey)
                ->when(app()->isLocal(), fn ($http) => $http->withoutVerifying())
                ->acceptJson()
                ->timeout(60)
                ->post("{$baseUrl}/chat/completions", [
                    'model' => $model,
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are a helpful, concise AI assistant inside Onyx Smart Todo.',
                        ],
                        ...$validated['messages'],
                    ],
                ]);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => $e->getMessage(),
            ], 502);
        }

        if ($response->failed()) {
            return response()->json([
                'error' => $response->json('error.message') ?? 'Failed to get a response from Groq.',
            ], $response->status() ?: 502);
        }

        $reply = $response->json('choices.0.message.content', '');

        return response()->json([
            'message' => [
                'role' => 'assistant',
                'content' => $reply,
            ],
        ]);
    }
}
