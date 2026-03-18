export enum ActivityCategory {
  OUTDOOR = 'OUTDOOR',
  SPORT = 'SPORT',
  SOCIAL = 'SOCIAL',
  INDOOR = 'INDOOR',
  HELP = 'HELP',
  OTHER = 'OTHER',
}

export const activityCategories: ActivityCategory[] = [
  ActivityCategory.OUTDOOR,
  ActivityCategory.SPORT,
  ActivityCategory.SOCIAL,
  ActivityCategory.INDOOR,
  ActivityCategory.HELP,
  ActivityCategory.OTHER,
];

export const activityCategoryLabels: Record<ActivityCategory, string> = {
  [ActivityCategory.OUTDOOR]: 'Outdoor',
  [ActivityCategory.SPORT]: 'Sport',
  [ActivityCategory.SOCIAL]: 'Social',
  [ActivityCategory.INDOOR]: 'Indoor',
  [ActivityCategory.HELP]: 'Help',
  [ActivityCategory.OTHER]: 'Other',
};
