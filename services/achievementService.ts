import { HabitType, DailyRecord } from '../types';

export interface Achievement {
  id: string;
  category: 'common' | 'specific';
  icon: string; // emoji
  title: string;
  description: string;
  target: number; // количество дней для получения
  isUnlocked: (records: DailyRecord[]) => boolean;
}

// Вспомогательная функция для расчета текущего стрика
const calculateCurrentStreak = (records: DailyRecord[]): number => {
  if (records.length === 0) return 0;
  
  const sorted = [...records].sort((a, b) => b.createdAt - a.createdAt);
  let streak = 0;
  
  // Логика: если есть запись за сегодня - начинаем с неё.
  // Если нет - начинаем с вчера.
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

// Ачивки для разных привычек
export const getAchievementsForHabit = (habitType: HabitType): Achievement[] => {
  const countSuccessful = (records: DailyRecord[]) => records.filter(r => r.isSuccessful).length;

  const commonAchievements: Achievement[] = [
    {
      id: 'first_day',
      category: 'common',
      icon: '🌱',
      title: 'Первый шаг',
      description: 'Первый день без привычки',
      target: 1,
      isUnlocked: (records) => countSuccessful(records) >= 1
    },
    {
      id: 'week_streak',
      category: 'common',
      icon: '🔥',
      title: 'Неделя силы',
      description: '7 дней подряд',
      target: 7,
      isUnlocked: (records) => calculateCurrentStreak(records) >= 7
    },
    {
      id: 'month_warrior',
      category: 'common',
      icon: '💪',
      title: 'Месяц силы воли',
      description: '30 дней успеха',
      target: 30,
      isUnlocked: (records) => countSuccessful(records) >= 30
    }
  ];

  const specificMap: Record<HabitType, Achievement[]> = {
    [HabitType.SMOKING]: [
      {
        id: 'clean_lungs',
        category: 'specific',
        icon: '🫁',
        title: 'Чистые лёгкие',
        description: '3 дня без сигарет',
        target: 3,
        isUnlocked: (records) => countSuccessful(records) >= 3
      },
      {
        id: 'breath_master',
        category: 'specific',
        icon: '🌬️',
        title: 'Мастер дыхания',
        description: '14 дней без курения',
        target: 14,
        isUnlocked: (records) => countSuccessful(records) >= 14
      }
    ],
    [HabitType.ALCOHOL]: [
      {
        id: 'clear_mind',
        category: 'specific',
        icon: '🧠',
        title: 'Ясный разум',
        description: '3 дня без алкоголя',
        target: 3,
        isUnlocked: (records) => countSuccessful(records) >= 3
      },
      {
        id: 'sober_king',
        category: 'specific',
        icon: '👑',
        title: 'Король трезвости',
        description: '14 дней без алкоголя',
        target: 14,
        isUnlocked: (records) => countSuccessful(records) >= 14
      }
    ],
    [HabitType.ENERGY_DRINKS]: [
      {
        id: 'natural_energy',
        category: 'specific',
        icon: '⚡',
        title: 'Натуральная энергия',
        description: '3 дня без энергетиков',
        target: 3,
        isUnlocked: (records) => countSuccessful(records) >= 3
      },
      {
        id: 'energy_master',
        category: 'specific',
        icon: '🔋',
        title: 'Мастер энергии',
        description: '14 дней без энергетиков',
        target: 14,
        isUnlocked: (records) => countSuccessful(records) >= 14
      }
    ],
    [HabitType.FAST_FOOD]: [
      {
        id: 'healthy_eater',
        category: 'specific',
        icon: '🥗',
        title: 'Здоровое питание',
        description: '3 дня без фастфуда',
        target: 3,
        isUnlocked: (records) => countSuccessful(records) >= 3
      },
      {
        id: 'nutrition_hero',
        category: 'specific',
        icon: '🍏',
        title: 'Герой питания',
        description: '14 дней без фастфуда',
        target: 14,
        isUnlocked: (records) => countSuccessful(records) >= 14
      }
    ],
    [HabitType.OTHER]: [
      {
        id: 'discipline_starter',
        category: 'specific',
        icon: '🎯',
        title: 'Начало дисциплины',
        description: '3 дня без привычки',
        target: 3,
        isUnlocked: (records) => countSuccessful(records) >= 3
      },
      {
        id: 'willpower_champion',
        category: 'specific',
        icon: '🏆',
        title: 'Чемпион воли',
        description: '14 дней без привычки',
        target: 14,
        isUnlocked: (records) => countSuccessful(records) >= 14
      }
    ]
  };

  const specifics = specificMap[habitType] || [];

  // Возвращаем в порядке прогрессии: 1 -> 3 -> 7 -> 14 -> 30
  // Common 1 (1 day)
  // Specific 1 (3 days)
  // Common 2 (7 days streak)
  // Specific 2 (14 days)
  // Common 3 (30 days)
  
  const result: Achievement[] = [];
  
  // 1 Day
  const firstDay = commonAchievements.find(a => a.target === 1);
  if (firstDay) result.push(firstDay);

  // 3 Days
  const spec3 = specifics.find(a => a.target === 3);
  if (spec3) result.push(spec3);

  // 7 Days
  const week = commonAchievements.find(a => a.target === 7);
  if (week) result.push(week);

  // 14 Days
  const spec14 = specifics.find(a => a.target === 14);
  if (spec14) result.push(spec14);

  // 30 Days
  const month = commonAchievements.find(a => a.target === 30);
  if (month) result.push(month);

  return result;
};

// Получить следующую ачивку для мотивации (первую заблокированную из упорядоченного списка)
export const getNextAchievement = (habitType: HabitType, records: DailyRecord[]): Achievement | null => {
  const achievements = getAchievementsForHabit(habitType);
  const nextAchievement = achievements.find(a => !a.isUnlocked(records));
  return nextAchievement || null;
};

// Получить все разблокированные ачивки
export const getUnlockedAchievements = (habitType: HabitType, records: DailyRecord[]): Achievement[] => {
  const achievements = getAchievementsForHabit(habitType);
  return achievements.filter(a => a.isUnlocked(records));
};

export { calculateCurrentStreak };