<?php

use App\Http\Controllers\ChatController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::get('chat', [ChatController::class, 'index'])->name('chat');
    Route::post('chat/messages', [ChatController::class, 'send'])->name('chat.send');
});

require __DIR__.'/settings.php';
