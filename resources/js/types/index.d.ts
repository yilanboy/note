export interface NoteSummary {
    slug: string;
    title: string;
    order?: number | null;
}

export interface NoteCategory {
    slug: string;
    displayName: string;
    notes: NoteSummary[];
}

export interface PageProps {
    noteTree: NoteCategory[];
}
