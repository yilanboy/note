<script lang="ts">
    import { inertia, page } from '@inertiajs/svelte';
    import { ChevronRight, X } from '@lucide/svelte';
    import { fade, slide } from 'svelte/transition';
    import { onMount, untrack } from 'svelte';
    import { isDesktop, sidebar } from '@/shared/sidebar.svelte.js';
    import type { NoteCategory } from '@/types';

    let noteTree = $derived((page.props.noteTree ?? []) as NoteCategory[]);
    let activeCategory = $derived(page.url.split('/')[1] ?? '');
    let activePath = $derived(page.url.split('?')[0]);
    let isSliding = $state(false);

    // Auto-close sidebar on mobile when route path changes (closed is the mobile default)
    $effect(() => {
        activePath;
        untrack(() => {
            if (!isDesktop.current) {
                sidebar.isOpen = false;
            }
        });
    });

    // Snap back to the viewport default when the breakpoint is crossed, so a
    // manual open/close on one side of the breakpoint doesn't leak to the other.
    $effect(() => {
        isDesktop.current;
        untrack(() => sidebar.reset());
    });

    function scrollToActive() {
        document
            .getElementById(activePath)
            ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }

    onMount(() => {
        sidebar.isOpen = isDesktop.current;
    });
</script>

<!-- Mobile overlay. Keyed on `preference` rather than `isOpen` so server-rendered
  HTML (where the viewport is unknown) never contains a visible overlay. -->
{#if sidebar.isOpen === true && !isDesktop.current}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        transition:fade={{ duration: 300 }}
        onclick={() => sidebar.reset()}
        class="fixed inset-0 z-40 bg-black/70"
    ></div>
{/if}

<!-- Always rendered; visibility is a CSS transform so the first paint is decided
  by the `lg:` media query alone — no JavaScript needed, hence no FOUC. The extra
  3rem clears the close button that overhangs the right edge. -->
<aside
    id="sidebar"
    inert={!sidebar.isOpen}
    class={{
        'fixed inset-y-0 top-16 z-40 flex w-72 flex-col transition-transform duration-300': true,
        '-translate-x-[calc(100%+3rem)] lg:translate-x-0':
            sidebar.isOpen === null,
        'translate-x-0': sidebar.isOpen === true,
        '-translate-x-[calc(100%+3rem)]': sidebar.isOpen === false,
    }}
>
    <button
        onclick={() => (sidebar.isOpen = false)}
        class="absolute top-3 -right-12 inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-zinc-400 transition-colors duration-200 hover:bg-zinc-800/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 lg:hidden"
        aria-label="Close sidebar"
    >
        <X class="size-5" />
    </button>

    <div
        class="z-10 flex grow flex-col gap-y-5 overflow-y-auto border-r border-zinc-200 bg-zinc-50 px-6 pb-4 transition-colors duration-300 dark:border-zinc-700 dark:bg-zinc-900"
    >
        <nav class="mt-6 flex flex-1 flex-col">
            <ul role="list" class="flex flex-1 flex-col gap-y-7">
                <li>
                    <ul role="list" class="-mx-2 space-y-1">
                        {#each noteTree as category (category.slug)}
                            {@const expanded = activeCategory === category.slug}
                            {@const href = `/${category.slug}`}
                            <li>
                                <a
                                    use:inertia
                                    {href}
                                    aria-expanded={expanded}
                                    class={{
                                        'flex w-full cursor-pointer items-center gap-x-2 rounded-lg p-2 text-sm font-semibold transition-colors duration-200': true,
                                        'text-zinc-700 hover:bg-zinc-200/50 dark:text-zinc-300 dark:hover:bg-zinc-800':
                                            href !== activePath,
                                        'pointer-events-none bg-zinc-200/50 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100':
                                            href === activePath,
                                    }}
                                >
                                    <ChevronRight
                                        class={{
                                            'size-4 shrink-0 transition-transform': true,
                                            'rotate-90': expanded,
                                        }}
                                    />
                                    {category.displayName}
                                </a>

                                {#if expanded}
                                    <ul
                                        transition:slide={{ duration: 150 }}
                                        onintrostart={() => {
                                            isSliding = true;
                                        }}
                                        onintroend={() => {
                                            isSliding = false;
                                            scrollToActive();
                                        }}
                                        class="mt-1 space-y-1 border-l border-zinc-200 pl-4 dark:border-zinc-700"
                                    >
                                        {#each category.notes as note (note.slug)}
                                            {@const href = `/${category.slug}/${note.slug}`}
                                            {@const noteTitle =
                                                note.order !== null &&
                                                note.order !== undefined
                                                    ? `${note.order}. ${note.title}`
                                                    : note.title}
                                            <li>
                                                <a
                                                    id={href}
                                                    use:inertia
                                                    {href}
                                                    class={{
                                                        'flex items-center rounded-lg p-2 text-sm text-zinc-600 transition-colors duration-200 hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:bg-zinc-800': true,
                                                        'pointer-events-none bg-zinc-200/50 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100':
                                                            href === activePath,
                                                    }}
                                                    title={noteTitle}
                                                >
                                                    {#if note.order !== null && note.order !== undefined}
                                                        <span
                                                            class="mr-2 w-6 shrink-0 text-right font-mono text-xs font-semibold tabular-nums text-emerald-600 dark:text-lividus-400"
                                                        >
                                                            {note.order}.
                                                        </span>
                                                    {/if}
                                                    <span class="min-w-0 truncate">{note.title}</span>
                                                </a>
                                            </li>
                                        {/each}
                                    </ul>
                                {/if}
                            </li>
                        {/each}
                    </ul>
                </li>
            </ul>
        </nav>
    </div>
</aside>
