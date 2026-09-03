<?php

it('returns a successful response', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
});

it('can visit fixture notes', function () {
    $this->get('/testing/code-blocks')->assertStatus(200);
    $this->get('/testing/mermaid')->assertStatus(200);
    $this->get('/testing/images')->assertStatus(200);
});
