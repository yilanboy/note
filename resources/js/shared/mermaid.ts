import mermaid from 'mermaid';

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
 * Scans the provided element for code blocks with the "mermaid" language
 * and renders them as diagrams. The original Mermaid code is stored in a
 * data attribute for theme-switching purposes.
 *
 * @param element The container element to scan for Mermaid diagrams.
 */
export const renderMermaidDiagrams = async (element: HTMLElement): Promise<void> => {
  // Find all potential Mermaid code blocks that haven't been processed yet.
  const mermaidBlocks = element.querySelectorAll<HTMLElement>('pre code.language-mermaid');

  if (mermaidBlocks.length === 0) {
    return; // No new diagrams to render
  }

  initializeMermaid(); // Set initial theme

  for (const block of mermaidBlocks) {
    const code = block.innerText;
    const preElement = block.parentElement as HTMLPreElement;

    try {
      const { svg } = await mermaid.render(`mermaid-diagram-${Math.random().toString(36).substring(2)}`, code);

      // Create a container for the diagram
      const diagramContainer = document.createElement('div');
      diagramContainer.classList.add('mermaid-diagram-container', 'flex', 'justify-center', 'my-6');
      diagramContainer.innerHTML = svg;
      
      // Store the original code to allow for re-rendering on theme change
      diagramContainer.dataset.mermaidCode = code;

      // Replace the <pre> block with the rendered diagram
      preElement.replaceWith(diagramContainer);

    } catch (error) {
      console.error('Mermaid rendering failed:', error);
      const errorContainer = document.createElement('div');
      errorContainer.classList.add('mermaid-error', 'text-red-500', 'font-mono', 'p-4', 'bg-red-100', 'dark:bg-red-900/30');
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

  const diagrams = document.querySelectorAll<HTMLElement>('.mermaid-diagram-container');

  for (const diagram of diagrams) {
    const code = diagram.dataset.mermaidCode;
    if (code) {
      try {
        // Re-render the SVG from the stored code
        const { svg } = await mermaid.render(`mermaid-diagram-${Math.random().toString(36).substring(2)}`, code);
        diagram.innerHTML = svg;
      } catch (error) {
        console.error('Mermaid re-rendering failed during theme switch:', error);
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
