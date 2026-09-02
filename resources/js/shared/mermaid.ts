import mermaid from 'mermaid';
import { zoom } from './zoom.svelte';

/**
 * Initializes Mermaid with the correct theme based on the document's class.
 * This function checks for a 'dark' class on the <html> element to set the theme.
 */
const initializeMermaid = () => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict', // Disallows HTML tags in diagrams for security
        theme: isDarkMode ? 'dark' : 'default',
    });
};

/**
 * Renders a Mermaid code string to an SVG string using the current theme.
 */
export const renderMermaidSvg = async (code: string): Promise<string> => {
    initializeMermaid();
    const { svg } = await mermaid.render(
        `mermaid-diagram-${Math.random().toString(36).substring(2)}`,
        code,
    );

    return svg;
};

/**
 * Scans the provided element for code blocks with the "mermaid" language
 * and renders them as diagrams. The original Mermaid code is stored in a
 * data attribute for theme-switching purposes.
 *
 * @param element The container element to scan for Mermaid diagrams.
 */
export const renderMermaidDiagrams = async (
    element: HTMLElement,
): Promise<void> => {
    // Find all potential Mermaid code blocks that haven't been processed yet.
    const mermaidBlocks = element.querySelectorAll<HTMLElement>(
        'pre code.language-mermaid',
    );

    if (mermaidBlocks.length === 0) {
        return; // No new diagrams to render
    }

    initializeMermaid(); // Set initial theme

    for (const block of mermaidBlocks) {
        const code = block.innerText;
        const preElement = block.parentElement as HTMLPreElement;

        try {
            const svg = await renderMermaidSvg(code);

            // Create a container for the diagram
            const diagramContainer = document.createElement('div');
            diagramContainer.classList.add(
                'mermaid-diagram-container',
                'group',
                'relative',
                'my-6',
                'flex',
                'justify-center',
            );
            diagramContainer.dataset.mermaidCode = code;

            // Toolbar on top-right: Zoom Button
            const toolbar = document.createElement('div');
            toolbar.className =
                'absolute right-2.5 top-2.5 z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100';

            const zoomBtn = document.createElement('button');
            zoomBtn.type = 'button';
            zoomBtn.className =
                'inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-zinc-200/90 bg-white text-zinc-600 shadow-2xs transition hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100 dark:focus:ring-lividus-500';
            zoomBtn.title = 'Zoom diagram';
            zoomBtn.setAttribute('aria-label', 'Zoom diagram');
            zoomBtn.innerHTML = `
                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
            `;

            zoomBtn.onclick = () => {
                const currentSvg =
                    diagramContainer.querySelector('.mermaid-svg-wrapper')
                        ?.innerHTML ?? svg;
                zoom.open({
                    type: 'mermaid',
                    svg: currentSvg,
                });
            };
            toolbar.appendChild(zoomBtn);

            const svgWrapper = document.createElement('div');
            svgWrapper.className =
                'mermaid-svg-wrapper flex w-full justify-center overflow-x-auto';
            svgWrapper.innerHTML = svg;

            diagramContainer.appendChild(toolbar);
            diagramContainer.appendChild(svgWrapper);

            // Replace the <pre> block with the rendered diagram
            preElement.replaceWith(diagramContainer);
        } catch (error) {
            console.error('Mermaid rendering failed:', error);
            const errorContainer = document.createElement('div');
            errorContainer.classList.add(
                'mermaid-error',
                'text-red-500',
                'font-mono',
                'p-4',
                'bg-red-100',
                'dark:bg-red-900/30',
            );
            errorContainer.innerText = `Error rendering diagram:\n${(error as Error).message}`;
            preElement.replaceWith(errorContainer);
        }
    }
};

/**
 * Finds all rendered Mermaid diagrams on the page and re-renders them
 * to match the current light/dark theme.
 */
const updateMermaidThemes = async () => {
    // Re-initialize mermaid with the potentially new theme
    initializeMermaid();

    const diagrams = document.querySelectorAll<HTMLElement>(
        '.mermaid-diagram-container',
    );

    for (const diagram of diagrams) {
        const code = diagram.dataset.mermaidCode;
        if (code) {
            try {
                // Re-render the SVG from the stored code
                const svg = await renderMermaidSvg(code);
                const svgWrapper = diagram.querySelector(
                    '.mermaid-svg-wrapper',
                );
                if (svgWrapper) {
                    svgWrapper.innerHTML = svg;
                } else {
                    diagram.innerHTML = svg;
                }
            } catch (error) {
                console.error(
                    'Mermaid re-rendering failed during theme switch:',
                    error,
                );
            }
        }
    }
};

// --- Theme Change Observer ---
// This code sets up a listener that triggers when the site's theme changes.
// It watches for changes to the `class` attribute on the <html> element.

// A flag to ensure the observer is only set up once.
let isObserverInitialized = false;

if (typeof window !== 'undefined' && !isObserverInitialized) {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            // If the class attribute changes, it's likely a theme switch.
            if (mutation.attributeName === 'class') {
                updateMermaidThemes();
                break;
            }
        }
    });

    observer.observe(document.documentElement, { attributes: true });
    isObserverInitialized = true;
}
