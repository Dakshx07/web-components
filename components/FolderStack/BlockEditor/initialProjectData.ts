import { ProjectDocument } from "./types";

// ════════════════════════════════════════════════════════════════════
// Initial Project Data
// Mock data is commented out per user request to provide a clean
// Notion-style editor canvas on opened folders.
// ════════════════════════════════════════════════════════════════════

/*
export const MOCK_PROJECT_DOCS: Record<string, ProjectDocument> = {
  "mary-colter": {
    id: "proj-mary-colter",
    slug: "mary-colter",
    metadata: {
      title: "Mary Colter — National Park Archival Dossier",
      category: "Indigenous Modernism & National Parks",
      status: "In Progress",
      date: "October 2026",
      summary:
        "Field documentation and structural analysis of Mary Jane Colter's Grand Canyon landmarks (1905–1935). Reinterpreting ancestral Puebloan masonry and native canyon stone into revolutionary vernacular modernism.",
    },
    blocks: [
      { id: "b1", type: "h1", content: "Desert View Watchtower & Hopi House Analysis" },
      { id: "b2", type: "paragraph", content: "Mary Colter did not impose alien structures onto the desert..." }
    ],
  },
  "frank-lloyd-wright": {
    id: "proj-flw",
    slug: "frank-lloyd-wright",
    metadata: {
      title: "Frank Lloyd Wright — Organic Architecture Archive",
      category: "Organic & Early Modernism",
      status: "Completed",
      date: "September 2026",
      summary: "Studies in the destruction of the box...",
    },
    blocks: [
      { id: "b1", type: "h1", content: "Fallingwater & The Philosophy of the Cantilever" }
    ],
  },
};
*/

export const DEFAULT_PROJECT_DOCS: Record<string, ProjectDocument> = {};

export const STORAGE_KEY = "mosby_folder_projects_v2";

export function createCleanDoc(slug: string): ProjectDocument {
  return {
    id: `proj-${slug}`,
    slug,
    metadata: {
      title: "",
      category: "Project Dossier",
      status: "Draft",
      date: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      summary: "",
    },
    blocks: [
      {
        id: `b-${Date.now()}-1`,
        type: "paragraph",
        content: "",
      },
    ],
  };
}

export function getProjectDoc(slug: string): ProjectDocument {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed[slug]) {
          const doc = parsed[slug];
          // If stored doc has legacy mock data, reset to clean
          if (
            doc.metadata?.title?.includes("Frank Lloyd Wright") ||
            doc.metadata?.title?.includes("Mary Colter") ||
            doc.metadata?.summary?.includes("Studies in the destruction")
          ) {
            const clean = createCleanDoc(slug);
            saveProjectDoc(clean);
            return clean;
          }
          return doc;
        }
      }
    } catch {
      // fallback
    }
  }

  return createCleanDoc(slug);
}

export function saveProjectDoc(doc: ProjectDocument): void {
  if (typeof window === "undefined") return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const existing = stored ? JSON.parse(stored) : {};
    existing[doc.slug] = doc;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch {
    // quota or privacy mode
  }
}

