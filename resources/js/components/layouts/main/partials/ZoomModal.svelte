<script lang="ts">
    import { X, Copy, Check } from '@lucide/svelte';
    import { fade, fly } from 'svelte/transition';
    import { zoom } from '@/shared/zoom.svelte';

    let copied = $state(false);
    let copyTimeout: number | undefined;

    async function copyCode() {
        if (!zoom.data?.code) return;
        try {
            await navigator.clipboard.writeText(zoom.data.code);
            copied = true;
            clearTimeout(copyTimeout);
            copyTimeout = window.setTimeout(() => {
                copied = false;
            }, 2000);
        } catch (err) {
            console.error('Failed to copy code:', err);
        }
    }

    function handleKeyDown(e: KeyboardEvent) {
        if (e.key === 'Escape' && zoom.isOpen) {
            e.preventDefault();
            zoom.close();
        }
    }

    // Lock body scroll when modal is open
    $effect(() => {
        if (zoom.isOpen) {
            const originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';

            return () => {
                document.body.style.overflow = originalOverflow;
            };
        }
    });
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if zoom.isOpen && zoom.data}
    <!-- Backdrop -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        transition:fade={{ duration: 150 }}
        onclick={() => zoom.close()}
        class="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-xs sm:p-6 lg:p-8"
    >
        <!-- Floating Close Button -->
        <button
            onclick={(e) => {
                e.stopPropagation();
                zoom.close();
            }}
            class="dark:focus:ring-lividus-500 fixed top-4 right-4 z-50 flex size-10 cursor-pointer items-center justify-center rounded-full bg-zinc-900/80 text-zinc-300 shadow-xl backdrop-blur-md transition-all hover:scale-105 hover:bg-zinc-800 hover:text-white focus:ring-2 focus:ring-emerald-500/60 focus:outline-none"
            aria-label="Close modal"
        >
            <X class="size-5" />
        </button>

        <!-- Modal Content Container -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            transition:fly={{ y: 15, duration: 200 }}
            onclick={(e) => e.stopPropagation()}
            class="relative flex max-h-[90vh] max-w-[95vw] items-center justify-center"
        >
            {#if zoom.data.type === 'image'}
                <div
                    class="overflow-hidden rounded-xl border border-zinc-200/20 bg-zinc-900/40 shadow-2xl backdrop-blur-xs"
                >
                    <img
                        src={zoom.data.src}
                        alt={zoom.data.alt ?? ''}
                        class="max-h-[85vh] max-w-[90vw] rounded-lg object-contain select-none"
                    />
                </div>
            {:else if zoom.data.type === 'code'}
                <div
                    class="relative flex max-h-[85vh] w-[90vw] max-w-5xl flex-col overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 shadow-2xl transition-colors dark:border-zinc-700 dark:bg-[#282c34]"
                >
                    <!-- Code Block Header Toolbar -->
                    <div
                        class="flex shrink-0 items-center justify-between border-b border-zinc-200/80 bg-zinc-200/60 px-5 py-3 dark:border-zinc-700/80 dark:bg-zinc-900/80"
                    >
                        <span
                            class="inline-flex h-7 items-center justify-center rounded-md border border-zinc-200/90 bg-white px-2.5 font-mono text-xs font-semibold tracking-wider text-zinc-700 uppercase shadow-2xs dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-300"
                        >
                            {zoom.data.language ?? 'CODE'}
                        </span>

                        <button
                            onclick={copyCode}
                            class="dark:focus:ring-lividus-500 inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-zinc-300/80 bg-white px-3 text-xs font-medium text-zinc-700 shadow-2xs transition hover:bg-zinc-50 focus:ring-2 focus:ring-emerald-500/60 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                            aria-label="Copy code"
                        >
                            {#if copied}
                                <Check
                                    class="dark:text-lividus-400 size-3.5 text-emerald-600"
                                />
                                <span
                                    class="dark:text-lividus-400 text-emerald-600"
                                    >Copied!</span
                                >
                            {:else}
                                <Copy
                                    class="size-3.5 text-zinc-500 dark:text-zinc-400"
                                />
                                <span>Copy</span>
                            {/if}
                        </button>
                    </div>

                    <!-- Code content -->
                    <div
                        class="zoom-code-scroll flex-1 overflow-auto p-5 font-mono text-sm leading-6"
                    >
                        {@html zoom.data.html}
                    </div>
                </div>
            {:else if zoom.data.type === 'mermaid'}
                <div
                    class="bg-zinc-25 dark:bg-zinc-850 relative flex max-h-[85vh] w-[90vw] max-w-5xl items-center justify-center overflow-auto rounded-xl border border-zinc-200 p-6 shadow-2xl transition-colors dark:border-zinc-700"
                >
                    <div
                        class="mermaid-modal-content flex w-full justify-center overflow-x-auto"
                    >
                        {@html zoom.data.svg}
                    </div>
                </div>
            {/if}
        </div>
    </div>
{/if}

<style>
    :global(.zoom-code-scroll pre.shiki) {
        margin: 0 !important;
        border: none !important;
        padding: 0 !important;
        background-color: transparent !important;
    }
    :global(.mermaid-modal-content svg) {
        max-width: 100%;
        height: auto;
    }
</style>
