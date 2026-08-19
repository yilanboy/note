import { createHighlighter, type Highlighter } from "shiki";
const THEMES = { light: "one-light", dark: "one-dark-pro" };
const LANGS = [
    "php",
    "svelte",
    "html",
    "bash",
    "text",
    "ini",
    "docker",
    "hcl",
    "rust",
    "typescript",
    "javascript",
    "yaml",
    "json",
    "sql",
    "python",
    "toml",
    "powershell",
    "css",
    "vim",
    "markdown",
    "http",
    "xml",
    "vue",
    "nginx",
    "blade",
    "jinja",
    "dotenv",
];

let highlighter: Highlighter | null = null;

async function getHighlighter(): Promise<Highlighter> {
    if (!highlighter) {
        highlighter = await createHighlighter({
            langs: LANGS,
            themes: ["one-light", "one-dark-pro"],
        });
    }

    return highlighter;
}

/**
 * Highlight every `<pre><code class="language-x">` block inside the container
 * with Shiki. Shiki itself and each grammar/theme are dynamically imported,
 * so they load on demand and never block the initial page render.
 */
export async function highlightCodeBlocks(container: HTMLElement): Promise<void> {
    const highlighter = await getHighlighter();
    const blocks = container.querySelectorAll<HTMLElement>(
        'pre:not(.shiki-highlighted) > code[class*="language-"]',
    );

    if (blocks.length === 0) {
        return;
    }

    await Promise.all(
        Array.from(blocks).map(async (code: HTMLElement) => {
            let language = /language-([\w-]+)/.exec(code.className)?.[1] ?? "text";

            // If the language is mermaid, skip highlighting, let mermaid.ts handle it
            if (language === "mermaid") {
                return;
            }

            // if language is not in LANGS, set it to "text"
            if (!LANGS.includes(language)) {
                language = "text";
            }

            const pre = code.parentElement;

            if (!(pre instanceof HTMLPreElement)) {
                return;
            }

            pre.outerHTML = highlighter.codeToHtml(code.textContent ?? "", {
                lang: language,
                themes: THEMES,
                defaultColor: "light",
            });
        }),
    );
}
