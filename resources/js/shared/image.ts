import { zoom } from "./zoom.svelte";

/**
 * Enhances all <img> elements within the container by wrapping them in a container
 * with a top-right zoom button that opens the zoom modal on click.
 */
export function enhanceImages(container: HTMLElement): void {
    const images = container.querySelectorAll<HTMLImageElement>(
        "img:not(.image-zoom-enhanced)",
    );

    if (images.length === 0) {
        return;
    }

    for (const img of images) {
        img.classList.add("image-zoom-enhanced");

        const wrapper = document.createElement("div");
        wrapper.className =
            "image-zoom-wrapper group relative my-6 inline-block w-full overflow-hidden rounded-lg";

        const zoomBtn = document.createElement("button");
        zoomBtn.type = "button";
        zoomBtn.className =
            "absolute right-2.5 top-2.5 z-10 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-zinc-200/90 bg-white text-zinc-600 shadow-2xs opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/60 dark:border-zinc-700 dark:bg-zinc-800/90 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100 dark:focus:ring-lividus-500";
        zoomBtn.title = "Zoom image";
        zoomBtn.setAttribute("aria-label", "Zoom image");
        zoomBtn.innerHTML = `
            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
        `;

        zoomBtn.onclick = (e) => {
            e.stopPropagation();
            zoom.open({
                type: "image",
                src: img.currentSrc || img.src,
                alt: img.alt || "",
            });
        };

        // If img has parent, replace img with wrapper containing img and zoomBtn
        if (img.parentElement) {
            img.parentElement.insertBefore(wrapper, img);
            wrapper.appendChild(img);
            wrapper.appendChild(zoomBtn);
        }
    }
}
