import mermaid from 'mermaid';

// For a more secure and performant setup, we initialize Mermaid with options
// that prevent it from executing arbitrary JavaScript.
// We also use a theme that's consistent with the site's dark/light modes.
const initializeMermaid = () => {
  const isDarkMode = document.documentElement.classList.contains('dark');

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict', // Disallows HTML tags in diagrams
    theme: isDarkMode ? 'dark' : 'default',
  });
};

/**
 * Scans the provided element for code blocks with the "mermaid" language
 * and renders them as diagrams.
 *
 * @param element The container element to scan for Mermaid diagrams.
 */
export const renderMermaidDiagrams = async (element: HTMLElement): Promise<void> => {
  // Find all potential Mermaid code blocks
  const mermaidBlocks = element.querySelectorAll<HTMLElement>('pre code.language-mermaid');

  if (mermaidBlocks.length === 0) {
    return; // No Mermaid diagrams to render
  }

  // Initialize Mermaid with the correct theme
  initializeMermaid();

  // Render each diagram
  for (const block of mermaidBlocks) {
    const code = block.innerText;
    const preElement = block.parentElement as HTMLPreElement;

    try {
      // Get the SVG code from Mermaid
      const { svg } = await mermaid.render(`mermaid-diagram-${Math.random().toString(36).substring(2)}`, code);

      // Create a new container for the SVG and replace the <pre> block
      const diagramContainer = document.createElement('div');
      diagramContainer.classList.add('mermaid-diagram-container', 'flex', 'justify-center', 'my-6');
      diagramContainer.innerHTML = svg;
      preElement.replaceWith(diagramContainer);
    } catch (error) {
      console.error('Mermaid rendering failed:', error);
      // Optionally, display an error message in place of the diagram
      const errorContainer = document.createElement('div');
      errorContainer.classList.add('mermaid-error', 'text-red-500', 'font-mono', 'p-4', 'bg-red-100', 'dark:bg-red-900/30');
      errorContainer.innerText = `Error rendering diagram:\n${(error as Error).message}`;
      preElement.replaceWith(errorContainer);
    }
  }
};
