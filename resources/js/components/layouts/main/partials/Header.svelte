<script lang="ts">
    import {
        PanelLeftClose,
        PanelLeftOpen,
        House,
        Sun,
        Moon,
        Search,
    } from '@lucide/svelte';
    import { sidebar } from '@/shared/sidebar.svelte.js';
    import { search } from '@/shared/search.svelte';
    import { inertia } from '@inertiajs/svelte';
    import { onMount } from 'svelte';
    import Github from '@/components/icons/Github.svelte';

    let mounted = $state(false);
    let isDark = $state(false);

    function toggleTheme() {
        isDark = !isDark;
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }

    onMount(() => {
        mounted = true;
        isDark = document.documentElement.classList.contains('dark');
    });
</script>

<header
    class="sticky top-0 z-50 h-16 bg-zinc-50 transition-colors duration-300 dark:bg-zinc-900"
>
    <nav
        aria-label="Global"
        class="flex h-full items-center justify-between border-b border-zinc-200 p-4 lg:px-8 dark:border-zinc-700"
    >
        <div class="flex flex-1 items-center gap-x-2">
            <button
                onclick={() => sidebar.toggle()}
                type="button"
                class="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition-colors duration-200 hover:bg-zinc-200/50 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:ring-zinc-700"
                aria-label="Toggle Sidebar"
            >
                <span class="sr-only">Toggle Sidebar</span>

                {#if !mounted}
                    <PanelLeftOpen class="size-5 lg:hidden" />
                    <PanelLeftClose class="hidden size-5 lg:block" />
                {:else if sidebar.isOpen}
                    <PanelLeftClose class="size-5" />
                {:else}
                    <PanelLeftOpen class="size-5" />
                {/if}
            </button>

            <a
                use:inertia
                href="/"
                class="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition-colors duration-200 hover:bg-zinc-200/50 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:ring-zinc-700"
                aria-label="Home"
            >
                <House class="size-5" />
            </a>

            <!-- Search Trigger Button (Mobile) -->
            <button
                onclick={() => (search.isOpen = true)}
                type="button"
                class="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition-colors duration-200 hover:bg-zinc-200/50 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-200 md:hidden dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:ring-zinc-700"
                aria-label="Search"
            >
                <Search class="size-5" />
            </button>
        </div>

        <!-- Centered Search Trigger Button (Desktop) -->
        <div class="hidden flex-1 items-center justify-center md:flex">
            <button
                onclick={() => (search.isOpen = true)}
                type="button"
                class="dark:hover:bg-zinc-850 flex w-72 cursor-pointer items-center justify-between gap-x-2.5 rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-normal text-zinc-400 transition-all hover:border-zinc-300 hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-200 lg:w-80 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500 dark:hover:border-zinc-700 dark:focus-visible:ring-zinc-700"
            >
                <span class="flex items-center gap-x-2">
                    <Search class="size-4 shrink-0" />
                    <span class="font-normal text-zinc-500 dark:text-zinc-400"
                        >Search notes...</span
                    >
                </span>
                <kbd
                    class="pointer-events-none inline-flex h-5.5 items-center gap-0.5 rounded border border-zinc-200 bg-white px-1.5 font-mono text-[11px] font-medium text-zinc-400 select-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500"
                >
                    <span class="text-xs">⌘</span>K
                </kbd>
            </button>
        </div>

        <div class="flex flex-1 items-center justify-end gap-x-3">
            <button
                onclick={toggleTheme}
                type="button"
                class="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition-all duration-200 hover:bg-zinc-200/50 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-200 active:scale-95 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:ring-zinc-700"
                aria-label="Toggle Theme"
            >
                <span class="sr-only">Toggle Theme</span>
                {#if !mounted}
                    <div class="size-5"></div>
                {:else if isDark}
                    <Sun
                        class="size-5 rotate-0 text-amber-500 transition-transform duration-300 hover:rotate-12"
                    />
                {:else}
                    <Moon
                        class="size-5 rotate-0 text-indigo-600 transition-transform duration-300 hover:-rotate-12 dark:text-indigo-400"
                    />
                {/if}
            </button>

            <a
                href="https://github.com/yilanboy/note.docfunc"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex size-10 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition-colors duration-200 hover:bg-zinc-200/50 hover:text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 dark:focus-visible:ring-zinc-700"
                aria-label="GitHub Repository"
            >
                <Github className="size-5" />
            </a>
        </div>
    </nav>
</header>
