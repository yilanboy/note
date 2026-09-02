import { createHighlighter, type Highlighter } from "shiki";
import { zoom } from "./zoom.svelte";

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

            const rawCode = code.textContent ?? "";
            const highlightedHtml = highlighter.codeToHtml(rawCode, {
                lang: language,
                themes: THEMES,
                defaultColor: "light",
            });

            // Create container wrapper
            const wrapper = document.createElement("div");
            wrapper.className = "code-block-wrapper group relative my-6";

            // Toolbar on top-right: Language Badge, Copy Button, Zoom Button
            const toolbar = document.createElement("div");
            toolbar.className =
                "absolute right-2.5 top-2.5 z-10 flex items-center gap-1.5 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100";

            // 1. Language badge
            const langBadge = document.createElement("span");
            langBadge.className =
                "inline-flex h-7 select-none items-center justify-center rounded-md border border-zinc-200/90 bg-white px-2.5 font-mono text-xs font-semibold text-zinc-700 shadow-2xs dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-300";
            langBadge.textContent = language;
            toolbar.appendChild(langBadge);

            // 2. Copy button
            const copyBtn = document.createElement("button");
            copyBtn.type = "button";
            copyBtn.className =
                "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-zinc-200/90 bg-white text-zinc-600 shadow-2xs transition hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100 dark:focus:ring-lividus-500";
            copyBtn.title = "Copy code";
            copyBtn.setAttribute("aria-label", "Copy code");
            copyBtn.innerHTML = `
                <svg class="copy-icon size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
                <svg class="check-icon hidden size-4 text-emerald-600 dark:text-lividus-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"></path></svg>
            `;

            let copyTimeout: number | undefined;
            copyBtn.onclick = async () => {
                try {
                    await navigator.clipboard.writeText(rawCode);
                    const copyIcon = copyBtn.querySelector(".copy-icon");
                    const checkIcon = copyBtn.querySelector(".check-icon");
                    copyIcon?.classList.add("hidden");
                    checkIcon?.classList.remove("hidden");
                    window.clearTimeout(copyTimeout);
                    copyTimeout = window.setTimeout(() => {
                        copyIcon?.classList.remove("hidden");
                        checkIcon?.classList.add("hidden");
                    }, 2000);
                } catch (err) {
                    console.error("Failed to copy code:", err);
                }
            };
            toolbar.appendChild(copyBtn);

            // 3. Zoom button
            const zoomBtn = document.createElement("button");
            zoomBtn.type = "button";
            zoomBtn.className =
                "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-zinc-200/90 bg-white text-zinc-600 shadow-2xs transition hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100 dark:focus:ring-lividus-500";
            zoomBtn.title = "Zoom code block";
            zoomBtn.setAttribute("aria-label", "Zoom code block");
            zoomBtn.innerHTML = `
                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
            `;

            zoomBtn.onclick = () => {
                zoom.open({
                    type: "code",
                    code: rawCode,
                    html: highlightedHtml,
                    language,
                });
            };
            toolbar.appendChild(zoomBtn);

            wrapper.appendChild(toolbar);

            const tempContainer = document.createElement("div");
            tempContainer.innerHTML = highlightedHtml;
            const highlightedPre = tempContainer.firstElementChild;
            if (highlightedPre instanceof HTMLElement) {
                highlightedPre.classList.add("shiki-highlighted");
                wrapper.appendChild(highlightedPre);
            }

            pre.replaceWith(wrapper);
        }),
    );
}

