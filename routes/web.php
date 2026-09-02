<?php

use App\Http\Controllers\SearchNotesController;
use App\Http\Controllers\ShowCategoryController;
use App\Http\Controllers\ShowHomeController;
use App\Http\Controllers\ShowNoteController;
use Illuminate\Support\Facades\Route;

// Use a scoped variable instead of a global constant to prevent "already defined" errors when routes are loaded multiple times during tests or in Octane.
$validPathPattern = '[0-9a-z\-]+';

Route::get('/', ShowHomeController::class)->name('home');

Route::get('/search', SearchNotesController::class)->name('search');

Route::get('/{category}', ShowCategoryController::class)
    ->where('category', $validPathPattern)
    ->name('notes.category');

Route::get('/{category}/{note}', ShowNoteController::class)
    ->where(['category' => $validPathPattern, 'note' => $validPathPattern])
    ->name('notes.note');
