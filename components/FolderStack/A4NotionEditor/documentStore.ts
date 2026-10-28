import { FolderCaseDocument, A4Page } from "./types";

const STORAGE_KEY = "mosby_a4_documents_v1";

export function createDefaultPage(pageNumber: number, title: string = ""): A4Page {
  return {
    id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    pageNumber,
    title,
    blocks: [
      {
        id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: "paragraph",
        content: "",
      },
    ],
  };
}

export function createDefaultCaseDoc(slug: string, defaultTitle: string): FolderCaseDocument {
  return {
    slug,
    leftDocument: {
      flap: "left",
      pages: [createDefaultPage(1, defaultTitle)],
    },
    rightDocument: {
      flap: "right",
      pages: [createDefaultPage(1, defaultTitle)],
    },
  };
}

export function loadFolderCaseDocument(
  slug: string,
  defaultTitle: string
): FolderCaseDocument {
  if (typeof window === "undefined") {
    return createDefaultCaseDoc(slug, defaultTitle);
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[slug]) {
        return parsed[slug];
      }
    }
  } catch {
    // fallback
  }

  return createDefaultCaseDoc(slug, defaultTitle);
}

export function saveFolderCaseDocument(doc: FolderCaseDocument): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[doc.slug] = doc;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // quota error handling
  }
}
