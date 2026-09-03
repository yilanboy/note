<?php

it('returns an empty array when no query is provided', function () {
    $response = $this->getJson('/search');

    $response->assertStatus(200)
        ->assertJson([]);
});

it('returns search results matching a query', function () {
    $response = $this->getJson('/search?q=SpecialKeyword');

    $response->assertStatus(200)
        ->assertJsonFragment([
            'category' => 'testing',
            'categoryName' => 'Testing',
            'slug' => 'search-target',
            'title' => 'SpecialKeyword Title',
        ]);
});

it('prioritizes title matches over content matches', function () {
    $response = $this->getJson('/search?q=SpecialKeyword');

    $response->assertStatus(200);
    $data = $response->json();

    // First result should have a high score because "SpecialKeyword" is in the title
    expect($data)->not->toBeEmpty()
        ->and($data[0]['title'])->toContain('SpecialKeyword Title');
});

it('normalizes search queries before matching', function () {
    $response = $this->getJson('/search?q=%EF%BC%B3%EF%BC%B0%EF%BC%A5%EF%BC%A3%EF%BC%A9%EF%BC%A1%EF%BC%AC');

    $response->assertStatus(200)
        ->assertJsonFragment([
            'slug' => 'search-target',
            'title' => 'SpecialKeyword Title',
        ]);
});

it('splits search terms on all whitespace characters', function () {
    $response = $this->getJson('/search?q=Special%09Keyword');

    $response->assertStatus(200)
        ->assertJsonFragment([
            'slug' => 'search-target',
            'title' => 'SpecialKeyword Title',
        ]);
});

it('uses Chinese fragments as a fallback when the complete query is not present', function () {
    $response = $this->getJson('/search?q=%E9%9B%99%E5%AD%97%E6%A9%9F%E5%88%B6');

    $response->assertStatus(200)
        ->assertJsonFragment([
            'slug' => 'search-target',
        ]);
});
