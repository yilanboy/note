<?php

use App\Http\Controllers\SearchNotesController;
use App\Http\Controllers\ShowCategoryController;
use App\Http\Controllers\ShowHomeController;
use App\Http\Controllers\ShowNoteController;
use Illuminate\Support\Facades\Route;

const VALID_PATH_PATTERN = '[0-9a-z\-]+';

Route::get('/', ShowHomeController::class)->name('home');

Route::get('/search', SearchNotesController::class)->name('search');

Route::get('/{category}', ShowCategoryController::class)
    ->where('category', VALID_PATH_PATTERN)
    ->name('notes.category');

Route::get('/{category}/{note}', ShowNoteController::class)
    ->where(['category' => VALID_PATH_PATTERN, 'note' => VALID_PATH_PATTERN])
    ->name('notes.note');
