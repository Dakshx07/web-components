export type BlockType =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "bullet"
  | "numbered"
  | "todo"
  | "quote"
  | "callout"
  | "code"
  | "divider"
  | "image"
  | "video"
  | "columns";

export type NotionColor =
  | "default"
  | "theme"
  | "gray"
  | "brown"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "red";

export interface ColumnData {
  id: string;
  widthRatio?: number;
  blocks: NotionBlock[];
}

export interface NotionBlock {
  id: string;
  type: BlockType;
  content: string;
  caption?: string;
  checked?: boolean;
  calloutIcon?: string;
  color?: NotionColor;
  backgroundColor?: NotionColor;
  columns?: ColumnData[];
  layoutColumns?: 2 | 3;
  widthPercentage?: number; // 25 to 100%
  alignment?: "left" | "center" | "right";
}

export interface SlashCommandItem {
  label: string;
  description: string;
  command: BlockType;
  shortcut: string;
  category: "suggested" | "basic" | "media";
  defaultColumns?: 2 | 3;
  initialType?: BlockType;
  columnLayoutPreset?: "sidebyside" | "3images" | "3text" | "columns";
  renderIcon: () => React.ReactNode;
}

export interface CommandPalettePosition {
  top: number;
  left: number;
}

export interface A4Page {
  id: string;
  pageNumber: number;
  title: string;
  blocks: NotionBlock[];
}

export interface FlapDocument {
  flap: "left" | "right";
  pages: A4Page[];
}

export interface FolderCaseDocument {
  slug: string;
  leftDocument: FlapDocument;
  rightDocument: FlapDocument;
  updatedAt?: number;
}
