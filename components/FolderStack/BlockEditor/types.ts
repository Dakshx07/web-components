export type BlockType =
  | "paragraph"
  | "h1"
  | "h2"
  | "h3"
  | "todo"
  | "bullet"
  | "image"
  | "video"
  | "divider";

export interface EditorBlock {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  url?: string;
  caption?: string;
}

export interface ProjectMetadata {
  title: string;
  category: string;
  status: "In Progress" | "Completed" | "Draft" | "Archived";
  date: string;
  summary: string;
}

export interface ProjectDocument {
  id: string;
  slug: string;
  metadata: ProjectMetadata;
  blocks: EditorBlock[];
}
