<?php

test('it highlights code blocks with supported languages and toolbar in notes', function () {
    $page = visit('/testing/code-blocks');

    $page->assertNoJavascriptErrors()
        ->assertPresent('.code-block-wrapper')
        ->assertPresent('pre.shiki')
        ->assertPresent('pre.shiki span')
        ->assertPresent('.code-block-wrapper button[aria-label="Copy code"]')
        ->assertPresent('.code-block-wrapper button[aria-label="Zoom code block"]')
        ->assertSee('namespace App\Http\Controllers');
});

test('it gracefully highlights unlisted languages using text fallback without errors', function () {
    $page = visit('/testing/code-blocks');

    $page->assertNoJavascriptErrors()
        ->assertPresent('pre.shiki')
        ->assertSee('composer require nunomaduro/larastan')
        ->assertSee('includes:');
});

test('it leaves mermaid code intact, renders mermaid svg diagram and provides zoom button', function () {
    $page = visit('/testing/mermaid');

    $page->assertNoJavascriptErrors()
        ->assertPresent('.mermaid-diagram-container svg')
        ->assertPresent('.mermaid-diagram-container button[aria-label="Zoom diagram"]')
        ->assertNotPresent('pre > code.language-mermaid')
        ->assertSee('測試圖表流程');
});

test('it wraps images with zoom button in notes', function () {
    $page = visit('/testing/images');

    $page->assertNoJavascriptErrors()
        ->assertPresent('.image-zoom-wrapper img')
        ->assertPresent('.image-zoom-wrapper button[aria-label="Zoom image"]');
});

test('it renders various code block languages across notes without javascript errors',
    function (string $url, string $expectedText) {
        $page = visit($url);

        $page->assertNoJavascriptErrors()
            ->assertSeeIn('pre.shiki', $expectedText);
    })->with([
        'php note' => ['/testing/code-blocks', 'UpdateUserAction'],
        'rust note' => ['/testing/code-blocks', 'cargo new'],
        'docker note' => ['/testing/code-blocks', 'FROM php:8.4-cli'],
        'neon note' => ['/testing/code-blocks', 'parameters:'],
    ]);

test('it renders nonsupport language as text', function () {
    $page = visit('/testing/code-blocks');

    $page->assertNoJavascriptErrors()
        ->assertSeeIn('pre.shiki', 'This is nonsupport language');
});
