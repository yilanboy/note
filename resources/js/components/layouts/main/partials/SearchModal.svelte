<script lang="ts">
    import { router } from '@inertiajs/svelte';
    import {
        Search,
        CornerDownLeft,
        Loader,
        FileText,
        X,
    } from '@lucide/svelte';
    import { fade, fly } from 'svelte/transition';
    import { search } from '@/shared/search.svelte';

    interface Result {
        category: string;
        categoryName: string;
        slug: string;
        title: string;
        snippet: string;
    }

    let query = $state('');
    let results = $state<Result[]>([]);
    let isLoading = $state(false);
    let selectedIndex = $state(0);
    let searchInput = $state<HTMLInputElement | null>(null);
    let resultsContainer = $state<HTMLDivElement | null>(null);

    let trimmed = $derived(query.trim());

    // Debounce logic for fetching search results
    let debounceTimeout: number | undefined;

    // Whenever query changes, run this effect
    function onSearchInput() {
        if (trimmed === '') {
            results = [];
            isLoading = false;

            return;
        }

        isLoading = true;
        clearTimeout(debounceTimeout);
        debounceTimeout = window.setTimeout(async () => {
            try {
                const response = await fetch(
                    `/search?q=${encodeURIComponent(trimmed)}`,
                );
                if (response.ok) {
                    results = await response.json();
                    selectedIndex = 0;
                }
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                isLoading = false;
            }
        }, 200);
    }

    // Focus the input automatically when the modal is opened
    function focusSearchInput() {
        query = '';
        results = [];
        selectedIndex = 0;
        searchInput?.focus();
    }

    // Scroll the selected item into view on keyboard navigation
    function scrollResultIntoView() {
        if (search.isOpen && resultsContainer && results.length > 0) {
            // Svelte tracks selectedIndex and results automatically
            const activeEl = resultsContainer.querySelector(
                `[data-index="${selectedIndex}"]`,
            );

            if (activeEl) {
                activeEl.scrollIntoView({ block: 'nearest' });
            }
        }
    }

    // Handlers for keys that only apply while the modal is open.
    // Each is responsible only for its own action; preventDefault is handled centrally.
    const openKeyHandlers: Record<string, () => void> = {
        Escape: () => {
            search.isOpen = false;
        },
        ArrowDown: () => {
            if (results.length > 0) {
                selectedIndex = (selectedIndex + 1) % results.length;
            }
            scrollResultIntoView();
        },
        ArrowUp: () => {
            if (results.length > 0) {
                selectedIndex =
                    (selectedIndex - 1 + results.length) % results.length;
            }
            scrollResultIntoView();
        },
        Enter: () => {
            const res = results[selectedIndex];
            if (!res) return;
            search.isOpen = false;
            router.visit(`/${res.category}/${res.slug}`);
        },
    };

    function handleGlobalKeyDown(e: KeyboardEvent) {
        // Open/Close on Cmd+K or Ctrl+K
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            search.isOpen = !search.isOpen;

            return;
        }

        // Open on slash / (if not in an input or textarea)
        const activeTag = document.activeElement?.tagName;
        if (
            e.key === '/' &&
            activeTag !== 'INPUT' &&
            activeTag !== 'TEXTAREA'
        ) {
            e.preventDefault();
            search.isOpen = true;

            return;
        }

        if (!search.isOpen) return;

        // Handle keys when open
        const handler = openKeyHandlers[e.key];
        if (handler) {
            e.preventDefault();
            handler();
        }
    }

    function navigateToResult(href: string) {
        search.isOpen = false;
        router.visit(href);
    }

    $effect(() => {
        if (search.isOpen) {
            focusSearchInput();
        }
    });
</script>

<svelte:window onkeydown={handleGlobalKeyDown} />

{#if search.isOpen}
    <!-- Backdrop -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        transition:fade={{ duration: 150 }}
        onclick={() => (search.isOpen = false)}
        class="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-[2px] transition-opacity"
    ></div>

    <!-- Modal Container -->
    <div
        class="pointer-events-none fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh]"
    >
        <div
            transition:fly={{ y: -20, duration: 200 }}
            class="bg-zinc-25 dark:bg-zinc-850 pointer-events-auto relative flex max-h-[60vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-zinc-200 shadow-2xl transition-colors duration-300 dark:border-zinc-700"
        >
            <!-- Search Input Wrapper -->
            <div
                class="flex items-center border-b border-zinc-200 px-5 dark:border-zinc-700"
            >
                <Search
                    class="size-5 shrink-0 text-zinc-400 dark:text-zinc-500"
                />
                <input
                    bind:this={searchInput}
                    bind:value={query}
                    oninput={onSearchInput}
                    type="text"
                    placeholder="Search notes... (esc to close)"
                    class="h-14 w-full bg-transparent px-4 text-base text-zinc-900 placeholder-zinc-400 outline-none dark:text-zinc-100 dark:placeholder-zinc-500"
                />
                <div class="flex shrink-0 items-center gap-3">
                    {#if isLoading}
                        <Loader
                            class="size-4 animate-spin text-zinc-400 dark:text-zinc-500"
                        />
                    {/if}
                    <button
                        onclick={() => (search.isOpen = false)}
                        class="text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
                        aria-label="Close"
                    >
                        <X class="size-5" />
                    </button>
                </div>
            </div>

            <!-- Results list -->
            {#if query.trim() !== ''}
                <div
                    bind:this={resultsContainer}
                    class="flex-1 scroll-p-3 overflow-y-auto p-3"
                >
                    {#if results.length > 0}
                        <ul class="space-y-1.5">
                            {#each results as result, idx (result.category + '-' + result.slug)}
                                <li>
                                    <button
                                        data-index={idx}
                                        onclick={() =>
                                            navigateToResult(
                                                `/${result.category}/${result.slug}`,
                                            )}
                                        onmouseenter={() =>
                                            (selectedIndex = idx)}
                                        class={{
                                            'flex w-full cursor-pointer items-start gap-4 rounded-lg border border-transparent px-4 py-3 text-left text-sm outline-none': true,
                                            'dark:bg-lividus-600 bg-emerald-600 text-white':
                                                selectedIndex === idx,
                                            'bg-transparent  text-zinc-700 dark:text-zinc-300':
                                                selectedIndex !== idx,
                                        }}
                                    >
                                        <FileText
                                            class="mt-0.5 size-5 shrink-0"
                                        />
                                        <span class="block min-w-0 flex-1">
                                            <span
                                                class="flex items-center gap-1.5 font-semibold"
                                            >
                                                <span
                                                    class={{
                                                        'text-[11px] tracking-wider uppercase opacity-70': true,
                                                        'text-zinc-100':
                                                            selectedIndex ===
                                                            idx,
                                                        'text-zinc-500 dark:text-zinc-400':
                                                            selectedIndex !==
                                                            idx,
                                                    }}
                                                >
                                                    {result.categoryName}
                                                </span>
                                                <span>/</span>
                                                <span class="truncate"
                                                    >{result.title}</span
                                                >
                                            </span>
                                            <span
                                                class={{
                                                    'mt-1 line-clamp-2 text-xs': true,
                                                    'text-zinc-200':
                                                        selectedIndex === idx,
                                                    'text-zinc-500 dark:text-zinc-400':
                                                        selectedIndex !== idx,
                                                }}
                                            >
                                                {result.snippet}
                                            </span>
                                        </span>
                                        <CornerDownLeft
                                            class={{
                                                'size-5 shrink-0 self-center': true,
                                                'opacity-85':
                                                    selectedIndex === idx,
                                                'opacity-0':
                                                    selectedIndex !== idx,
                                            }}
                                        />
                                    </button>
                                </li>
                            {/each}
                        </ul>
                    {:else if !isLoading}
                        <div
                            class="py-10 text-center text-base text-zinc-500 dark:text-zinc-400"
                        >
                            No results found for "<span
                                class="font-medium text-zinc-700 dark:text-zinc-300"
                                >{query}</span
                            >"
                        </div>
                    {/if}
                </div>
            {:else}
                <!-- Default State / Search Tips -->
                <div
                    class="space-y-3 p-8 text-center text-sm text-zinc-400 dark:text-zinc-500"
                >
                    <p class="font-semibold text-zinc-700 dark:text-zinc-300">
                        Search Note Titles & Contents
                    </p>
                    <p>
                        Type keywords to search. The search engine supports
                        multi-term logical AND searching.
                    </p>
                    <div class="flex justify-center gap-5 pt-3">
                        <span
                            class="inline-flex items-center gap-1.5 rounded border border-zinc-200 bg-zinc-200/50 px-2 py-0.5 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800/50"
                        >
                            <kbd class="font-sans">↑↓</kbd> Navigate
                        </span>
                        <span
                            class="inline-flex items-center gap-1.5 rounded border border-zinc-200 bg-zinc-200/50 px-2 py-0.5 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800/50"
                        >
                            <kbd class="font-sans">↵</kbd> Select
                        </span>
                        <span
                            class="inline-flex items-center gap-1.5 rounded border border-zinc-200 bg-zinc-200/50 px-2 py-0.5 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-800/50"
                        >
                            <kbd class="font-sans">esc</kbd> Close
                        </span>
                    </div>
                </div>
            {/if}
        </div>
    </div>
{/if}
