<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\MarkdownConverter;
use Inertia\Inertia;
use Inertia\Response;

class ShowHomeController extends Controller
{
    public function __construct(private readonly MarkdownConverter $markdownConverter) {}

    /**
     * Handle the incoming request.
     */
    public function __invoke(): Response
    {
        $path = config('notes.path').'/README.md';

        abort_unless(file_exists($path), 404);

        return Inertia::render('Page', [
            'title' => config('app.name'),
            'html' => $this->markdownConverter->convertFile($path),
        ]);
    }
}
