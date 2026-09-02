export type ZoomContentType = 'image' | 'code' | 'mermaid';

export interface ZoomData {
    type: ZoomContentType;
    src?: string;
    alt?: string;
    code?: string;
    html?: string;
    language?: string;
    svg?: string;
    mermaidCode?: string;
}

class ZoomState {
    isOpen = $state(false);
    data = $state<ZoomData | null>(null);

    open(data: ZoomData) {
        this.data = data;
        this.isOpen = true;
    }

    close() {
        this.isOpen = false;
        this.data = null;
    }
}

export const zoom = new ZoomState();
