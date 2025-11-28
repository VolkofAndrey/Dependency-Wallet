
// services/achievementService.ts
import { HabitType, DailyRecord } from '../types';

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  description: string;
  target: number;
  category: 'common' | 'specific';
  isUnlocked: (records: DailyRecord[]) => boolean;
}

export const calculateCurrentStreak = (records: DailyRecord[]): number => {
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

export const getAchievementsForHabit = (habitType: HabitType): Achievement[] => {
  const commonAchievements: Achievement[] = [
    {
      id: 'first_day',
      icon: '🌱',
      title: 'Первый шаг',
      description: 'Первый день без привычки',
      target: 1,
      category: 'common',
      isUnlocked: (records) => records.filter(r => r.isSuccessful).length >= 1
    },
    {
      id: 'week_streak',
      icon: '🔥',
      title: 'Неделя силы',
      description: '7 дней подряд',
      target: 7,
      category: 'common',
      isUnlocked: (records) => calculateCurrentStreak(records) >= 7
    },
    {
      id: 'month_warrior',
      icon: '💪',
      title: 'Месяц силы',
      description: '30 дней успеха',
      target: 30,
      category: 'common',
      isUnlocked: (records) => records.filter(r => r.isSuccessful).length >= 30
    }
  ];

  const habitSpecificAchievements: Record<HabitType, Achievement[]> = {
    [HabitType.SMOKING]: [
      {
        id: 'clean_lungs',
        icon: '🫁',
        title: 'Чистые лёгкие',
        description: '3 дня без сигарет',
        target: 3,
        category: 'specific',
        isUnlocked: (records) => records.filter(r => r.isSuccessful).length >= 3
      },
      {
        id: 'breath_master',
        icon: '🌬️',
        title: 'Свежее дыхание',
        description: '14 дней без курения',
        target: 14,
        category: 'specific',
        isUnlocked: (records) => records.filter(r => r.isSuccessful).length >= 14
      }
    ],
    [HabitType.COFFEE]: [
      {
        id: 'energy_natural',
        icon: '⚡',
        title: 'Своя энергия',
        description: '3 дня без кофе',
        target: 3,
        category: 'specific',
        isUnlocked: (records) => records.filter(r => r.isSuccessful).length >= 3
      },
      {
        id: 'caffeine_free',
        icon: '🍃',
        title: 'Без кофеина',
        description: '14 дней без кофе',
        target: 14,
        category: 'specific',
        isUnlocked: (records) => records.filter(r => r.isSuccessful).length >= 14
      }
    ],
    [HabitType.ALCOHOL]: [
      {
        id: 'clear_mind',
        icon: '🧠',
        title: 'Ясный разум',
        description: '3 дня без алкоголя',
        target: 3,
        category: 'specific',
        isUnlocked: (records) => records.filter(r => r.isSuccessful).length >= 3
      },
      {
        id: 'sober_king',
        icon: '👑',
        title: 'Король трезвости',
        description: '14 дней без алкоголя',
        target: 14,
        category: 'specific',
        isUnlocked: (records) => records.filter(r => r.isSuccessful).length >= 14
      }
    ],
    [HabitType.ENERGY_DRINKS]: [
      {
        id: 'natural_energy',
        icon: '⚡',
        title: 'Натуральная энергия',
        description: '3 дня без энергетиков',
        target: 3,
        category: 'specific',
        isUnlocked: (records) => records.filter(r => r.isSuccessful).length >= 3
      },
      {
        id: 'energy_master',
        icon: '🔋',
        title: 'Мастер энергии',
        description: '14 дней без энергетиков',
        target: 14,
        category: 'specific',
        isUnlocked: (records) => records.filter(r => r.isSuccessful).length >= 14
      }
    ],
    [HabitType.FAST_FOOD]: [
      {
        id: 'healthy_eater',
        icon: '🥗',
        title: 'Здоровое питание',
        description: '3 дня без фастфуда',
        target: 3,
        category: 'specific',
        isUnlocked: (records) => records.filter(r => r.isSuccessful).length >= 3
      },
      {
        id: 'nutrition_hero',
        icon: '🍏',
        title: 'Герой питания',
        description: '14 дней без фастфуда',
        target: 14,
        category: 'specific',
        isUnlocked: (records) => records.filter(r => r.isSuccessful).length >= 14
      }
    ],
    [HabitType.OTHER]: [
      {
        id: 'discipline_starter',
        icon: '🎯',
        title: 'Начало дисциплины',
        description: '3 дня без привычки',
        target: 3,
        category: 'specific',
        isUnlocked: (records) => records.filter(r => r.isSuccessful).length >= 3
      },
      {
        id: 'willpower_champion',
        icon: '🏆',
        title: 'Чемпион воли',
        description: '14 дней без привычки',
        target: 14,
        category: 'specific',
        isUnlocked: (records) => records.filter(r => r.isSuccessful).length >= 14
      }
    ]
  };

  return [...commonAchievements, ...(habitSpecificAchievements[habitType] || [])];
};

export const getNextAchievement = (habitType: HabitType, records: DailyRecord[]): Achievement | null => {
  const achievements = getAchievementsForHabit(habitType);
  const nextAchievement = achievements.find(a => !a.isUnlocked(records));
  return nextAchievement || null;
};

export const getUnlockedAchievements = (habitType: HabitType, records: DailyRecord[]): Achievement[] => {
  const achievements = getAchievementsForHabit(habitType);
  return achievements.filter(a => a.isUnlocked(records));
};
