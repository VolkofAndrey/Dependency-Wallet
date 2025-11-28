
import { AppState, DEFAULT_SETTINGS, DailyRecord, Frequency, Habit, Goal, HabitType } from '../types';
import { ASSETS } from '../data/assets';

const STORAGE_KEY = 'dependency_wallet_data';

const getInitialState = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migration: ensure achievedGoals exists
      if (!parsed.achievedGoals) parsed.achievedGoals = [];
      return parsed;
    }
  } catch (e) {
    console.error("Failed to parse storage, resetting to default", e);
  }
  return {
    habit: null,
    goal: null,
    achievedGoals: [],
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

// --- Suggested Goals ---

export const SUGGESTED_GOALS = [
  { 
    name: 'JBL PartyBox 110', 
    price: 35000, 
    img: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&fit=crop'
  },
  { 
    name: 'PlayStation 5', 
    price: 60000, 
    img: ASSETS.PS5
  },
  { 
    name: 'Электросамокат Kugoo', 
    price: 74000, 
    img: 'https://images.unsplash.com/photo-1559311043-09f919eb3d2d?w=400&fit=crop'
  },
  { 
    name: 'Отпуск в Турцию', 
    price: 80000, 
    img: ASSETS.CRIMEA
  },
  { 
    name: 'Обучение (Курсы)', 
    price: 50000, 
    img: ASSETS.EDUCATION
  },
  { 
    name: 'Кофемашина', 
    price: 45000, 
    img: ASSETS.COFFEE
  },
  { 
    name: 'Шуба', 
    price: 120000, 
    img: ASSETS.COAT
  },
  { 
    name: 'Фотоаппарат', 
    price: 180000, 
    img: ASSETS.CAMERA
  },
  { 
    name: 'MacBook Air M4', 
    price: 140000, 
    img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&fit=crop'
  },
  { 
    name: 'Мебель для квартиры', 
    price: 150000, 
    img: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&fit=crop'
  },
  { 
    name: 'iPhone 17 Pro', 
    price: 150000, 
    img: ASSETS.IPHONE
  },
];
