<?php

use App\Models\User;
use Illuminate\Support\Facades\Http;

test('chat screen requires authentication', function () {
    $response = $this->get(route('chat'));

    $response->assertRedirect(route('login'));
});

test('chat screen can be rendered for authenticated users', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get(route('chat'));

    $response->assertOk();
});

test('authenticated users can send chat messages via groq', function () {
    Http::fake([
        'api.groq.com/*' => Http::response([
            'choices' => [
                [
                    'message' => [
                        'role' => 'assistant',
                        'content' => 'Hello from Groq!',
                    ],
                ],
            ],
        ], 200),
    ]);

    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson(route('chat.send'), [
        'messages' => [
            ['role' => 'user', 'content' => 'Hi there'],
        ],
    ]);

    $response->assertOk()
        ->assertJson([
            'message' => [
                'role' => 'assistant',
                'content' => 'Hello from Groq!',
            ],
        ]);
});

