export interface TabConfig {
  label: string;
  color: string;
  textColor: string;
}

export interface FolderConfig {
  id: number;
  primaryColor: string;
  tabs: TabConfig[];
  contentId: string;
  contentDate: string;
  contentText: string;
}

export type AnimationPhase = "stack" | "collapsing" | "folder3d" | "reader";
