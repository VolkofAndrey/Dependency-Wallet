
import { AppState, DEFAULT_SETTINGS, DailyRecord, Frequency, Habit, Goal, HabitType } from '../types';
import { ASSETS } from '../data/assets';

const STORAGE_KEY = 'dependency_wallet_data';

const getInitialState = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to parse storage, resetting to default", e);
  }
  return {
    habit: null,
    goal: null,
    records: [],
    settings: DEFAULT_SETTINGS
  };
};

export const saveState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state to localStorage", e);
  }
};

export const loadState = (): AppState => {
  return getInitialState();
};

// --- Calculation Logic ---

export const calculateDailySavings = (habit: Habit): number => {
  switch (habit.frequency) {
    case Frequency.DAILY:
      return habit.costPerOccurrence;
    case Frequency.WEEKLY:
      return habit.costPerOccurrence / 7;
    case Frequency.MULTIPLE_DAILY:
      return habit.costPerOccurrence * (habit.timesPerDay || 1);
    case Frequency.MULTIPLE_WEEKLY:
      return (habit.costPerOccurrence * (habit.timesPerWeek || 1)) / 7;
    default:
      return 0;
  }
};

export const calculateTotalSaved = (records: DailyRecord[]): number => {
  return records.reduce((total, record) => {
    return record.isSuccessful ? total + record.amountSaved : total;
  }, 0);
};

export const calculateDaysRemaining = (goal: Goal, totalSaved: number, dailySavings: number): number => {
  const remainingAmount = goal.targetAmount - totalSaved;
  if (remainingAmount <= 0) return 0;
  if (dailySavings <= 0) return 999; 
  return Math.ceil(remainingAmount / dailySavings);
};

export const calculateStreak = (records: DailyRecord[]): number => {
  if (records.length === 0) return 0;
  
  const sorted = [...records].sort((a, b) => b.createdAt - a.createdAt);
  
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  
  let expectedDate = new Date();
  
  const hasToday = sorted.find(r => r.date === today);
  
  if (!hasToday) {
     expectedDate.setDate(expectedDate.getDate() - 1);
  }

  for (let i = 0; i < sorted.length; i++) {
    const record = sorted[i];
    const checkDateStr = expectedDate.toISOString().split('T')[0];

    if (record.date === checkDateStr && record.isSuccessful) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (record.date === checkDateStr && !record.isSuccessful) {
      break; 
    } else if (new Date(record.date) > expectedDate) {
        continue;
    } else {
        break; 
    }
  }
  
  return streak;
};

export const getTodayRecord = (records: DailyRecord[]): DailyRecord | undefined => {
  const today = new Date().toISOString().split('T')[0];
  return records.find(r => r.date === today);
};

// --- Mock Data Generators for Onboarding ---

export const SUGGESTED_GOALS = [
  { 
    name: 'iPhone 17 Pro', 
    price: 150000, 
    img: ASSETS.IPHONE
  },
  { 
    name: 'PlayStation 5', 
    price: 60000, 
    img: ASSETS.PS5
  },
  { 
    name: 'Отпуск в Крыму', 
    price: 100000, 
    img: ASSETS.CRIMEA
  },
  { 
    name: 'Обучение/Курсы', 
    price: 80000, 
    img: ASSETS.EDUCATION
  },
  { 
    name: 'Шуба', 
    price: 150000, 
    img: ASSETS.COAT
  },
  { 
    name: 'Фотоаппарат', 
    price: 200000, 
    img: ASSETS.CAMERA
  },
];
