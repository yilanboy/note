<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Normalizer;

class NoteRepository
{
    /**
     * Get all categories with their notes, ordered by category slug.
     *
     * @return array<int, array{slug: string, displayName: string, notes: array<int, array{slug: string, title: string, order: ?int}>}>
     */
    public function tree(): array
    {
        return Cache::remember(
            'notes:tree:'.$this->fingerprint(),
            now()->addWeek(),
            fn (): array => collect(glob(config('notes.path').'/*', GLOB_ONLYDIR))
                ->map(fn (string $directory): array => [
                    'slug' => basename($directory),
                    'displayName' => $this->displayName(basename($directory)),
                    'notes' => $this->notes(basename($directory)),
                ])
                ->filter(fn (array $category): bool => $category['notes'] !== [])
                ->sortBy('slug')
                ->values()
                ->all(),
        );
    }

    /**
     * Get the notes of a category, ordered by file name (numeric prefix first).
     *
     * @return array<int, array{slug: string, title: string, order: ?int}>
     */
    public function notes(string $category): array
    {
        return collect(glob(config('notes.path')."/{$category}/*.md"))
            ->reject(fn (string $path): bool => basename($path) === 'README.md')
            ->map(fn (string $path): array => [
                'slug' => $this->slug($path),
                'title' => $this->title($path),
                'order' => $this->order($path),
            ])
            ->values()
            ->all();
    }

    /**
     * Find a note file by its category and slug.
     *
     * The slug is matched against the scanned files of the category, so URL
     * input never touches the filesystem path directly.
     *
     * @return array{path: string, slug: string, title: string, order: ?int}|null
     */
    public function find(string $category, string $slug): ?array
    {
        foreach (glob(config('notes.path')."/{$category}/*.md") as $path) {
            if (basename($path) !== 'README.md' && $this->slug($path) === $slug) {
                return [
                    'path' => $path,
                    'slug' => $slug,
                    'title' => $this->title($path),
                    'order' => $this->order($path),
                ];
            }
        }

        return null;
    }

    /**
     * Resolve the display name of a category from config, falling back to headline case.
     */
    public function displayName(string $category): string
    {
        return config("notes.display_names.{$category}") ?? Str::headline($category);
    }

    /**
     * Search notes by keyword in title and content.
     *
     * @return array<int, array{category: string, categoryName: string, slug: string, title: string, snippet: string}>
     */
    public function search(string $query): array
    {
        $query = $this->normalizeSearchText($query);
        if ($query === '') {
            return [];
        }

        $terms = $this->searchTerms($query);
        if (empty($terms)) {
            return [];
        }

        $results = [];
        $searchIndex = $this->getSearchIndex();
        $chineseFragments = $this->chineseFragments($query);

        foreach ($searchIndex as $note) {
            $title = $note['searchTitle'];
            $content = $note['searchContent'];

            $exactTitleMatch = str_contains($title, $query);
            $exactContentMatch = str_contains($content, $query);
            $titleTermsMatched = $this->containsAllTerms($title, $terms);
            $contentTermsMatched = $this->containsAllTerms($content, $terms);
            $chineseMatch = false;
            $matchedChineseFragments = 0;

            if (! $exactTitleMatch && ! $exactContentMatch && $chineseFragments !== []) {
                $titleChineseFragments = $this->matchingFragmentCount($title, $chineseFragments);
                $contentChineseFragments = $this->matchingFragmentCount($content, $chineseFragments);
                $matchedChineseFragments = max($titleChineseFragments, $contentChineseFragments);
                $chineseMatch = $matchedChineseFragments >= (int) ceil(count($chineseFragments) / 2);
            }

            if (! $titleTermsMatched && ! $contentTermsMatched && ! $chineseMatch) {
                continue;
            }

            $score = 0;
            if ($exactTitleMatch) {
                $score += 100;
            }

            if ($exactContentMatch) {
                $score += 20;
            }

            if ($titleTermsMatched) {
                $score += 10;
            }

            if ($contentTermsMatched) {
                $score += 1;
            }

            if ($chineseMatch) {
                $score += $matchedChineseFragments;
            }

            $results[] = [
                'category' => $note['category'],
                'categoryName' => $note['categoryName'],
                'slug' => $note['slug'],
                'title' => $note['title'],
                'snippet' => $this->generateSnippet($note['content'], $query),
                'score' => $score,
            ];
        }

        // Sort by search score descending
        usort($results, fn ($a, $b) => $b['score'] <=> $a['score']);

        return array_values($results);
    }

    /**
     * Build a cached search index of all notes.
     *
     * @return array<int, array{category: string, categoryName: string, slug: string, title: string, content: string, searchTitle: string, searchContent: string}>
     */
    public function getSearchIndex(): array
    {
        return Cache::remember(
            'notes:search_index:'.$this->fingerprint(),
            now()->addWeek(),
            function (): array {
                $index = [];
                $files = glob(config('notes.path').'/*/*.md');

                foreach ($files as $path) {
                    if (basename($path) === 'README.md') {
                        continue;
                    }

                    $category = basename(dirname($path));
                    $title = $this->title($path);
                    $content = file_get_contents($path);

                    $index[] = [
                        'category' => $category,
                        'categoryName' => $this->displayName($category),
                        'slug' => $this->slug($path),
                        'title' => $title,
                        'content' => $content,
                        'searchTitle' => $this->normalizeSearchText($title),
                        'searchContent' => $this->normalizeSearchText($content),
                    ];
                }

                return $index;
            }
        );
    }

    /**
     * Extract a text snippet around the search query.
     */
    private function generateSnippet(string $content, string $query): string
    {
        // Strip Markdown headers/formatting characters for a clean text preview
        $clean = preg_replace('/[#*`_\-]/', '', $content);
        $clean = $this->normalizeSearchText($clean ?? '');
        $query = $this->normalizeSearchText($query);

        $pos = mb_stripos($clean, $query, 0, 'UTF-8');
        if ($pos === false) {
            return mb_substr($clean, 0, 120).'...';
        }

        $start = max(0, $pos - 40);
        $length = min(mb_strlen($clean) - $start, 120);
        $snippet = mb_substr($clean, $start, $length);

        if ($start > 0) {
            $snippet = '...'.$snippet;
        }
        if ($start + $length < mb_strlen($clean)) {
            $snippet .= '...';
        }

        return $snippet;
    }

    /**
     * Normalize text before comparing it during a search.
     */
    private function normalizeSearchText(string $text): string
    {
        $normalized = Normalizer::normalize($text, Normalizer::FORM_C);
        $normalized = is_string($normalized) ? $normalized : $text;
        $normalized = mb_convert_kana($normalized, 'as', 'UTF-8');
        $normalized = mb_strtolower($normalized, 'UTF-8');

        return preg_replace('/\s+/u', ' ', trim($normalized)) ?? trim($normalized);
    }

    /**
     * Split a normalized query by any Unicode whitespace character.
     *
     * @return array<int, string>
     */
    private function searchTerms(string $query): array
    {
        $terms = preg_split('/\s+/u', $query, -1, PREG_SPLIT_NO_EMPTY);

        return array_values(array_unique($terms ?: []));
    }

    /**
     * Return overlapping two-character fragments for Chinese-only queries.
     *
     * @return array<int, string>
     */
    private function chineseFragments(string $query): array
    {
        if (str_contains($query, ' ') || preg_match('/[^\p{Han}\s]/u', $query) === 1) {
            return [];
        }

        preg_match_all('/\p{Han}+/u', $query, $matches);
        $fragments = [];

        foreach ($matches[0] as $run) {
            $characters = mb_str_split($run);

            for ($index = 0, $last = count($characters) - 1; $index < $last; $index++) {
                $fragments[] = $characters[$index].$characters[$index + 1];
            }
        }

        return array_values(array_unique($fragments));
    }

    /**
     * Determine whether every query term occurs in the searchable text.
     *
     * @param  array<int, string>  $terms
     */
    private function containsAllTerms(string $text, array $terms): bool
    {
        return array_all($terms, fn ($term) => str_contains($text, $term));
    }

    /**
     * Count the Chinese fragments that occur in searchable text.
     *
     * @param  array<int, string>  $fragments
     */
    private function matchingFragmentCount(string $text, array $fragments): int
    {
        $matches = 0;

        foreach ($fragments as $fragment) {
            if (str_contains($text, $fragment)) {
                $matches++;
            }
        }

        return $matches;
    }

    /**
     * Build the slug of a note file: drop the extension and the numeric sort prefix.
     */
    private function slug(string $path): string
    {
        $name = basename($path, '.md');

        $slug = preg_replace('/^\d+[-.]?/', '', $name);

        return $slug === '' ? $name : $slug;
    }

    /**
     * Extract the numeric sort prefix of a note file, if present.
     */
    private function order(string $path): ?int
    {
        $name = basename($path, '.md');

        if (preg_match('/^(\d+)[-.]?/', $name, $matches)) {
            return (int) $matches[1];
        }

        return null;
    }

    /**
     * Resolve the note title from its first H1, falling back to the slug.
     */
    private function title(string $path): string
    {
        $handle = fopen($path, 'r');

        try {
            while (($line = fgets($handle)) !== false) {
                if (str_starts_with($line, '# ')) {
                    return trim(mb_substr($line, 2));
                }
            }
        } finally {
            fclose($handle);
        }

        return Str::headline($this->slug($path));
    }

    /**
     * A cheap change detector for the whole notes directory, so the cached
     * tree is rebuilt whenever a note is added, renamed, or edited.
     */
    private function fingerprint(): string
    {
        $files = glob(config('notes.path').'/*/*.md');

        return count($files).':'.max([0, ...array_map(filemtime(...), $files)]);
    }
}
