
import React, { useState, useEffect } from 'react';
import { AppState, Habit, Goal, DailyRecord, DEFAULT_SETTINGS, AchievedGoal } from './types';
import { loadState, saveState, calculateDailySavings } from './services/storageService';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import History from './components/History';
import Settings from './components/Settings';
import { Home, BarChart2, Settings as SettingsIcon } from 'lucide-react';
import { scheduleNotification } from './services/notificationService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState | null>(null);
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'history' | 'settings'>('dashboard');

  useEffect(() => {
    const loaded = loadState();
    // Ensure default settings are merged if new fields are added (like dailyReminderTime)
    if (loaded) {
        loaded.settings = { ...DEFAULT_SETTINGS, ...loaded.settings };
        if (!loaded.settings.dailyReminderTime) {
            loaded.settings.dailyReminderTime = '18:00';
        }
        if (!loaded.achievedGoals) {
            loaded.achievedGoals = [];
        }
    }
    setState(loaded);
  }, []);

  useEffect(() => {
    if (state) {
      saveState(state);
      
      // Update Notification Schedule when settings change
      if (state.settings.dailyReminder) {
         scheduleNextNotification(state.settings.dailyReminderTime);
      }
    }
  }, [state]);

  const scheduleNextNotification = (timeStr: string) => {
      const [h, m] = timeStr.split(':').map(Number);
      const now = new Date();
      const target = new Date();
      target.setHours(h, m, 0, 0);

      if (target <= now) {
          // If time passed today, schedule for tomorrow
          target.setDate(target.getDate() + 1);
      }

      const delay = target.getTime() - now.getTime();
      
      // In a real app we would cancel previous timers, but for this demo/MVP 
      // simple scheduling works. This will queue a notification.
      scheduleNotification('HabitHero Напоминание', 'Не забудь отметить свой прогресс сегодня!', delay);
  };

  const handleOnboardingComplete = (habit: Habit, goal: Goal) => {
    if (!state) return;
    const newState: AppState = {
      ...state,
      habit,
      goal,
      settings: { ...state.settings, onboardingCompleted: true }
    };
    setState(newState);
  };

  const handleCheckIn = (isSuccessful: boolean) => {
    if (!state || !state.habit) return;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const dailyAmount = calculateDailySavings(state.habit);
    // При срыве мы НЕ отнимаем деньги, просто добавляем 0
    const amountSaved = isSuccessful ? dailyAmount : 0;

    const newRecord: DailyRecord = {
      id: Date.now().toString(),
      date: todayStr,
      isSuccessful,
      amountSaved,
      createdAt: Date.now()
    };

    // Remove existing record for today if any (updates decision)
    const filteredRecords = state.records.filter(r => r.date !== todayStr);

    setState({
      ...state,
      records: [...filteredRecords, newRecord]
    });
  };

  const handleArchiveGoal = (achievedGoal: AchievedGoal) => {
    if (!state) return;
    setState({
        ...state,
        achievedGoals: [...state.achievedGoals, achievedGoal],
        goal: null, // Reset current goal
        records: [] // Reset records to start fresh for new goal
    });
  };

  const handleUpdateHabit = (updatedHabit: Habit | null) => {
    if (!state) return;
    setState({ ...state, habit: updatedHabit });
  };

  const handleUpdateGoal = (updatedGoal: Goal | null) => {
    if (!state) return;
    setState({ ...state, goal: updatedGoal });
  };

  const handleUpdateSettings = (key: string, value: any) => {
      if (!state) return;
      setState({
          ...state,
          settings: { ...state.settings, [key]: value }
      });
  };

  const handleReset = () => {
    // Очищаем localStorage
    localStorage.removeItem('dependency_wallet_data');
    
    // Сбрасываем React state в дефолтное состояние без перезагрузки страницы
    setState({
        habit: null,
        goal: null,
        achievedGoals: [],
        records: [],
        settings: DEFAULT_SETTINGS
    });
    setCurrentTab('dashboard');
  };

  if (!state) return <div className="h-screen w-full flex items-center justify-center bg-gray-100 text-gray-400">Загрузка...</div>;

  // Render Mobile Container
  return (
    <div className="min-h-screen bg-gray-200 flex justify-center items-center">
        {/* Mobile Mockup Container */}
        <div className="w-full max-w-[420px] h-[100dvh] md:h-[850px] bg-white md:rounded-[40px] shadow-2xl overflow-hidden relative border-8 border-gray-900/10 md:border-gray-900">
            
            {/* Dynamic Content */}
            {!state.settings.onboardingCompleted ? (
                <Onboarding onComplete={handleOnboardingComplete} />
            ) : (
                <>
                    <main className="h-full">
                        {currentTab === 'dashboard' && (
                            <Dashboard 
                                state={state} 
                                onCheckIn={handleCheckIn} 
                                onArchiveGoal={handleArchiveGoal}
                                onUpdateGoal={handleUpdateGoal}
                            />
                        )}
                        {currentTab === 'history' && (
                            <History state={state} />
                        )}
                        {currentTab === 'settings' && (
                            <Settings 
                                state={state} 
                                onReset={handleReset} 
                                onUpdateHabit={handleUpdateHabit}
                                onUpdateGoal={handleUpdateGoal}
                                onUpdateSettings={handleUpdateSettings}
                            />
                        )}
                    </main>

                    {/* Bottom Navigation */}
                    <div className="absolute bottom-0 w-full bg-white border-t border-gray-100 px-6 py-4 pb-6 md:pb-6 flex justify-around items-center rounded-b-[32px] md:rounded-b-[32px]">
                         <button 
                            onClick={() => setCurrentTab('dashboard')}
                            className={`flex flex-col items-center space-y-1 ${currentTab === 'dashboard' ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                         >
                             <Home size={24} strokeWidth={currentTab === 'dashboard' ? 2.5 : 2} />
                             <span className="text-[10px] font-medium">Главная</span>
                         </button>

                         <button 
                            onClick={() => setCurrentTab('history')}
                            className={`flex flex-col items-center space-y-1 ${currentTab === 'history' ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                         >
                             <BarChart2 size={24} strokeWidth={currentTab === 'history' ? 2.5 : 2} />
                             <span className="text-[10px] font-medium">Прогресс</span>
                         </button>

                         <button 
                            onClick={() => setCurrentTab('settings')}
                            className={`flex flex-col items-center space-y-1 ${currentTab === 'settings' ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                         >
                             <SettingsIcon size={24} strokeWidth={currentTab === 'settings' ? 2.5 : 2} />
                             <span className="text-[10px] font-medium">Настройки</span>
                         </button>
                    </div>
                </>
            )}
        </div>
    </div>
  );
};

export default App;
