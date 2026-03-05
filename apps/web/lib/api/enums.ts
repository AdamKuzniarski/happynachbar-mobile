export enum ActivityCategory {
  OUTDOOR = "OUTDOOR",
  SPORT = "SPORT",
  SOCIAL = "SOCIAL",
  INDOOR = "INDOOR",
  HELP = "HELP",
  OTHER = "OTHER",
}

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  ActivityCategory.OUTDOOR,
  ActivityCategory.SPORT,
  ActivityCategory.SOCIAL,
  ActivityCategory.INDOOR,
  ActivityCategory.HELP,
  ActivityCategory.OTHER,
];

export const ACTIVITY_CATEGORY_LABELS: Record<string, string> = {
  [ActivityCategory.OUTDOOR]: "Outdoor",
  [ActivityCategory.SPORT]: "Sport",
  [ActivityCategory.SOCIAL]: "Sozial",
  [ActivityCategory.INDOOR]: "Indoor",
  [ActivityCategory.HELP]: "Hilfe",
  [ActivityCategory.OTHER]: "Sonstiges",
};

export function formatActivityCategory(category?: string | null) {
  if (!category) return "—";
  return ACTIVITY_CATEGORY_LABELS[category] ?? category;
}

