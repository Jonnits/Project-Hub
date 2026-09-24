export const STORY_POINTS = [1, 2, 3, 5, 8, 13] as const;

export type StoryPoint = (typeof STORY_POINTS)[number];

export function storyPointLabel(points: number | null | undefined) {
  if (points == null) return "No estimate";
  return `${points} ${points === 1 ? "point" : "points"}`;
}
