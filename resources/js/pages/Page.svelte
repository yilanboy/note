<script module>
    export { default as layout } from '@/components/layouts/main/MainLayout.svelte';
</script>

<script lang="ts">
    import { highlightCodeBlocks } from '@/shared/highlight';
    import { renderMermaidDiagrams } from '@/shared/mermaid';
    import { enhanceImages } from '@/shared/image';

    interface Props {
        title: string;
        html: string;
    }

    let { title, html }: Props = $props();

    // Highlights code blocks, renders Mermaid diagrams, and enhances images after mount.
    // This runs when the note changes because the attachment reads `html`.
    function processContent(article: HTMLElement) {
        highlightCodeBlocks(article);
        renderMermaidDiagrams(article);
        enhanceImages(article);
    }
</script>

<svelte:head>
    <title>{title}</title>
</svelte:head>

<main class="mx-auto w-full max-w-3xl px-4 py-8 lg:px-8">
    <article
        {@attach processContent}
        class="prose prose-zinc dark:prose-invert prose-p:wrap-break-word prose-a:text-emerald-600 prose-a:no-underline
           prose-a:underline-offset-2 visited:prose-a:text-emerald-700 prose-a:hover:text-emerald-700 prose-a:hover:underline focus:prose-a:ring-2 focus:prose-a:ring-emerald-300/60 focus:prose-a:outline-none dark:prose-a:text-lividus-400 dark:visited:prose-a:text-lividus-300 dark:prose-a:hover:text-lividus-300 dark:focus:prose-a:ring-lividus-800/60 prose-blockquote:rounded-[0.3rem] prose-blockquote:border-emerald-300
           prose-blockquote:bg-emerald-50 prose-blockquote:px-4 prose-blockquote:py-3 prose-blockquote:font-semibold prose-blockquote:text-emerald-900 prose-blockquote:not-italic dark:prose-blockquote:border-lividus-700 dark:prose-blockquote:bg-lividus-950/30 dark:prose-blockquote:text-lividus-200 max-w-none leading-8"
    >
        <!-- Safe: html is rendered server-side from our own Markdown files with html_input=strip -->
        {@html html}
    </article>
</main>
