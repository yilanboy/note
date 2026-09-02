<script lang="ts">
    import type { Snippet } from 'svelte';
    import Sidebar from '@/components/layouts/main/partials/Sidebar.svelte';
    import Header from '@/components/layouts/main/partials/Header.svelte';
    import SearchModal from '@/components/layouts/main/partials/SearchModal.svelte';
    import ZoomModal from '@/components/layouts/main/partials/ZoomModal.svelte';
    import { sidebar } from '@/shared/sidebar.svelte';

    interface Props {
        children: Snippet;
    }

    let { children }: Props = $props();
</script>

<div
    class="bg-zinc-25 dark:bg-zinc-850 relative min-h-screen w-full text-zinc-900 transition-colors duration-300 dark:text-zinc-100"
>
    <Header />

    <Sidebar />

    <div
        class={{
            'transition-all duration-300 ease-in-out': true,
            'pl-0 lg:pl-72': sidebar.isOpen === null,
            'pl-0': sidebar.isOpen === false,
            'lg:pl-72': sidebar.isOpen === true,
        }}
    >
        {@render children?.()}
    </div>

    <SearchModal />
    <ZoomModal />
</div>
