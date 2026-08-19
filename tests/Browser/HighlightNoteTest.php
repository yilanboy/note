<?php

test('it highlights code blocks with supported languages in notes', function () {
    $page = visit('/laravel/action-pattern-in-laravel');

    $page->assertNoJavascriptErrors()
        ->assertPresent('pre.shiki')
        ->assertPresent('pre.shiki span')
        ->assertSee('namespace App\Http\Controllers');
});

test('it gracefully highlights unlisted languages using text fallback without errors', function () {
    $page = visit('/php/static-analysis');

    $page->assertNoJavascriptErrors()
        ->assertPresent('pre.shiki')
        ->assertSee('composer require nunomaduro/larastan')
        ->assertSee('includes:');
});

test('it leaves mermaid code intact and renders mermaid svg diagram', function () {
    $page = visit('/laravel/laravel-read-write-splitting');

    $page->assertNoJavascriptErrors()
        ->assertPresent('.mermaid-diagram-container svg')
        ->assertNotPresent('pre > code.language-mermaid')
        ->assertSee('Laravel 讀寫分離');
});

test('it renders various code block languages across notes without javascript errors', function (string $url, string $expectedText) {
    $page = visit($url);

    $page->assertNoJavascriptErrors()
        ->assertPresent('pre.shiki')
        ->assertSee($expectedText);
})->with([
    'php note' => ['/laravel/action-pattern-in-laravel', 'UpdateUserAction'],
    'rust note' => ['/rust/cargo-usage', 'cargo new'],
    'docker note (unlisted langs)' => ['/docker/best-practice', 'Dockerfile'],
    'php static analysis (neon)' => ['/php/static-analysis', 'Larastan'],
]);
