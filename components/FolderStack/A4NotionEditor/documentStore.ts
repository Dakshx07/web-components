import { FolderCaseDocument, A4Page } from "./types";

const STORAGE_KEY = "mosby_a4_documents_v1";

// In-memory session cache ensuring active documents survive unmounts & storage quotas
const sessionDocCache = new Map<string, FolderCaseDocument>();

/**
 * Compresses an image file or data URL via an offscreen canvas to prevent
 * localStorage QuotaExceededError (~120KB-180KB JPEG instead of 5-8MB raw base64)
 */
export async function compressImageDataUrl(
  input: string | File,
  maxDimension = 1280,
  quality = 0.82
): Promise<string> {
  if (typeof window === "undefined") {
    return typeof input === "string" ? input : "";
  }

  return new Promise((resolve) => {
    const processImageSrc = (src: string) => {
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL("image/jpeg", quality);
        resolve(compressed);
      };
      img.onerror = () => resolve(src);
      img.src = src;
    };

    if (typeof input === "string") {
      processImageSrc(input);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          processImageSrc(reader.result);
        } else {
          resolve("");
        }
      };
      reader.onerror = () => resolve("");
      reader.readAsDataURL(input);
    }
  });
}

export function createDefaultPage(pageNumber: number, title: string = ""): A4Page {
  return {
    id: `page-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    pageNumber,
    title,
    blocks: [
      {
        id: `blk-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
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
  // First check in-memory session cache for latest state
  if (sessionDocCache.has(slug)) {
    return sessionDocCache.get(slug)!;
  }

  if (typeof window === "undefined") {
    return createDefaultCaseDoc(slug, defaultTitle);
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed[slug]) {
        sessionDocCache.set(slug, parsed[slug]);
        return parsed[slug];
      }
    }
  } catch {
    // fallback
  }

  const def = createDefaultCaseDoc(slug, defaultTitle);
  sessionDocCache.set(slug, def);
  return def;
}

export function saveFolderCaseDocument(doc: FolderCaseDocument): void {
  // Always update in-memory cache first
  sessionDocCache.set(doc.slug, doc);

  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[doc.slug] = doc;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch (e) {
    // If quota exceeded, attempt to prune old entries
    try {
      const cleanAll: Record<string, FolderCaseDocument> = {};
      cleanAll[doc.slug] = doc;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanAll));
    } catch {
      // In-memory cache guarantees active session integrity
    }
  }
}
