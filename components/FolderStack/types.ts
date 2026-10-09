export interface TabConfig {
  label: string;
  color: string;
  textColor?: string;
  slug?: string;
}

export interface ScrapbookItem {
  id: string;
  type: "photo" | "postcard" | "note" | "drawing";
  title?: string;
  desc?: string;
  src?: string;
  width: number;
  height?: number;
  initialX: number;
  initialY: number;
  rotation: number;
  zIndex: number;
}

export interface ArchitectCase {
  slug: string;
  name: string;
  color: string;
  textColor: string;
  theme: "dark" | "light";
  born: string;
  died: string;
  location: string;
  portrait: string;
  leadParagraph: string;
  dropCap: string;
  bodyParagraphs: string[];
  scrapbookItems: ScrapbookItem[];
}

export interface FolderGroupConfig {
  groupId: number;
  category: string;
  primaryColor: string;
  description: string;
  cases: ArchitectCase[];
}

export type AnimationPhase = "stack" | "collapsing" | "unfolding" | "case-view";
