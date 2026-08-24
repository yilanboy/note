<?php

it('returns an empty array when no query is provided', function () {
    $response = $this->getJson('/search');

    $response->assertStatus(200)
        ->assertJson([]);
});

it('returns search results matching a query', function () {
    $response = $this->getJson('/search?q=Boost');

    $response->assertStatus(200)
        ->assertJsonFragment([
            'category' => 'laravel',
            'categoryName' => 'Laravel',
            'slug' => 'laravel-boost',
            'title' => 'Laravel Boost',
        ]);
});

it('prioritizes title matches over content matches', function () {
    $response = $this->getJson('/search?q=Boost');

    $response->assertStatus(200);
    $data = $response->json();

    // First result should have a high score because "Boost" is in the title
    expect($data)->not->toBeEmpty()
        ->and($data[0]['title'])->toContain('Boost');
});

it('normalizes search queries before matching', function () {
    $response = $this->getJson('/search?q=%EF%BC%A2%EF%BC%AF%EF%BC%AF%EF%BC%B3%EF%BC%B4');

    $response->assertStatus(200)
        ->assertJsonFragment([
            'slug' => 'laravel-boost',
            'title' => 'Laravel Boost',
        ]);
});

it('splits search terms on all whitespace characters', function () {
    $response = $this->getJson('/search?q=Laravel%09Boost');

    $response->assertStatus(200)
        ->assertJsonFragment([
            'slug' => 'laravel-boost',
            'title' => 'Laravel Boost',
        ]);
});

it('uses Chinese fragments as a fallback when the complete query is not present', function () {
    $response = $this->getJson('/search?q=%E9%80%99%E6%AC%A1%E6%9C%8D%E5%8B%99');

    $response->assertStatus(200)
        ->assertJsonFragment([
            'slug' => 'november-2025-outage',
        ]);
});
