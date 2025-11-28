
export enum HabitType {
  SMOKING = 'SMOKING',
  ALCOHOL = 'ALCOHOL',
  COFFEE = 'COFFEE',
  ENERGY_DRINKS = 'ENERGY_DRINKS',
  FAST_FOOD = 'FAST_FOOD',
  OTHER = 'OTHER'
}

export enum Frequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MULTIPLE_DAILY = 'MULTIPLE_DAILY',
  MULTIPLE_WEEKLY = 'MULTIPLE_WEEKLY'
}

export interface Habit {
  id: string;
  type: HabitType;
  customName?: string;
  costPerOccurrence: number;
  frequency: Frequency;
  timesPerDay?: number;
  timesPerWeek?: number;
  createdAt: number;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  imagePath: string; // URL or Base64
  createdAt: number;
}

export interface AchievedGoal extends Goal {
  achievedAt: number;
  daysToAchieve: number;
  amountSaved: number;
}

export interface DailyRecord {
  id: string;
  date: string; // YYYY-MM-DD
  isSuccessful: boolean;
  amountSaved: number;
  createdAt: number;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  dailyReminder: boolean;
  dailyReminderTime: string;
  weeklyReminder: boolean;
  onboardingCompleted: boolean;
}

export interface AppState {
  habit: Habit | null;
  goal: Goal | null;
  achievedGoals: AchievedGoal[];
  records: DailyRecord[];
  settings: AppSettings;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  dailyReminder: true,
  dailyReminderTime: '18:00',
  weeklyReminder: true,
  onboardingCompleted: false,
};
