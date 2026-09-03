<?php

use App\Services\NoteRepository;

beforeEach(function () {
    config(['notes.path' => resource_path('notes')]);
});

it('can visit all category pages and returns 200', function () {
    $paths = glob(resource_path('notes').'/*', GLOB_ONLYDIR);

    foreach ($paths as $path) {
        $category = basename($path);
        $response = $this->get(route('notes.category', ['category' => $category]));

        $response->assertStatus(200);
    }
});

it('can visit all note pages and returns 200', function () {
    $repository = app(NoteRepository::class);
    $tree = $repository->tree();

    expect($tree)->not->toBeEmpty();

    foreach ($tree as $category) {
        foreach ($category['notes'] as $note) {
            $response = $this->get("/{$category['slug']}/{$note['slug']}");

            $response->assertStatus(200);
        }
    }
});
