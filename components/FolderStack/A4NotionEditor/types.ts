export type BlockType =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "bullet"
  | "numbered"
  | "quote"
  | "code"
  | "divider"
  | "image"
  | "video";

export interface NotionBlock {
  id: string;
  type: BlockType;
  content: string;
  caption?: string;
}

export interface SlashCommandItem {
  label: string;
  description: string;
  command: BlockType;
  shortcut: string;
  iconName: string;
}

export interface CommandPalettePosition {
  top: number;
  left: number;
}
