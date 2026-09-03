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

it('extracts note order from numeric file prefix', function () {
    $repository = app(NoteRepository::class);
    $tree = $repository->tree();

    $awsCategory = collect($tree)->firstWhere('slug', 'aws');
    expect($awsCategory)->not->toBeNull();

    $awsCli = collect($awsCategory['notes'])->firstWhere('slug', 'aws-cli');
    expect($awsCli)->not->toBeNull()
        ->and($awsCli['order'])->toBe(1);

    $egressGateway = collect($awsCategory['notes'])->firstWhere('slug', 'egress-only-gateway-introduction');
    expect($egressGateway)->not->toBeNull()
        ->and($egressGateway['order'])->toBe(2);
});
