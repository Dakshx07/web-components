import { FolderGroupConfig, ArchitectCase } from "./types";

export interface CaseNavigationTarget {
  groupIndex: number;
  caseIndex: number;
  case: ArchitectCase;
  group: FolderGroupConfig;
}

// Flat ordered sequence of all 8 architect dossiers matching Mosby 1:1
export const CASE_SLUG_SEQUENCE: { groupIndex: number; caseIndex: number; slug: string }[] = [
  { groupIndex: 0, caseIndex: 0, slug: "frank-lloyd-wright" },
  { groupIndex: 0, caseIndex: 1, slug: "irving-gill" },
  { groupIndex: 1, caseIndex: 0, slug: "frank-gehry" },
  { groupIndex: 2, caseIndex: 0, slug: "louis-kahn" },
  { groupIndex: 2, caseIndex: 1, slug: "i-m-pei" },
  { groupIndex: 2, caseIndex: 2, slug: "paul-rudolph" },
  { groupIndex: 3, caseIndex: 0, slug: "mary-colter" },
  { groupIndex: 3, caseIndex: 1, slug: "louis-sullivan" },
];

export function getNextCaseTarget(
  currentSlug: string,
  groups: FolderGroupConfig[]
): CaseNavigationTarget {
  const currentIndex = CASE_SLUG_SEQUENCE.findIndex((item) => item.slug === currentSlug);
  const nextItem =
    currentIndex >= 0
      ? CASE_SLUG_SEQUENCE[(currentIndex + 1) % CASE_SLUG_SEQUENCE.length]
      : CASE_SLUG_SEQUENCE[0];

  const group = groups[nextItem.groupIndex] || groups[0];
  const targetCase = group.cases[nextItem.caseIndex] || group.cases[0];

  return {
    groupIndex: nextItem.groupIndex,
    caseIndex: nextItem.caseIndex,
    case: targetCase,
    group,
  };
}
