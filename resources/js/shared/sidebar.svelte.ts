import { MediaQuery } from 'svelte/reactivity';

// Must stay in sync with Tailwind's `lg` breakpoint (1024px). Using matchMedia
// means we share the same breakpoint engine as the `lg:` utility classes.
// The `true` fallback is only used during SSR, where the viewport is unknown.
export const isDesktop = new MediaQuery('min-width: 1024px', true);

/**
 * Sidebar visibility. `preference` is the user's explicit choice; `null` means
 * "follow the viewport default" (open on desktop, closed on mobile). Keeping
 * the default in CSS (`lg:` classes keyed on `preference === null`) makes the
 * first paint correct before any JavaScript runs, avoiding FOUC.
 */
class Sidebar {
    isOpen: boolean | null = $state(null);

    toggle(): void {
        this.isOpen = !this.isOpen;
    }

    /** Back to the viewport default. */
    reset(): void {
        this.isOpen = isDesktop.current;
    }
}

export const sidebar = new Sidebar();
