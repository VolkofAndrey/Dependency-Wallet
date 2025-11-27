import React, { useState } from 'react';
import { AppState, Habit, Goal, HabitType, Frequency } from '../types';
import { Trash2, Bell, Share2, Info, ChevronRight, Edit2, AlertCircle, X, Clock } from 'lucide-react';
import { requestNotificationPermission, scheduleNotification } from '../services/notificationService';

interface SettingsProps {
  state: AppState;
  onReset: () => void;
  onUpdateHabit: (habit: Habit) => void;
  onUpdateGoal: (goal: Goal) => void;
  onUpdateSettings: (key: string, value: any) => void;
}

const Settings: React.FC<SettingsProps> = ({ state, onReset, onUpdateHabit, onUpdateGoal, onUpdateSettings }) => {
  const { habit, goal, settings } = state;
  const [editingHabit, setEditingHabit] = useState(false);
  const [editingGoal, setEditingGoal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // Edit Habit State
  const [habitCost, setHabitCost] = useState(habit?.costPerOccurrence.toString() || '');
  const [habitFreq, setHabitFreq] = useState<Frequency>(habit?.frequency || Frequency.DAILY);
  const [habitTimesPerDay, setHabitTimesPerDay] = useState(habit?.timesPerDay?.toString() || '');

  // Edit Goal State
  const [goalName, setGoalName] = useState(goal?.name || '');
  const [goalTarget, setGoalTarget] = useState(goal?.targetAmount.toString() || '');
  const [goalImage, setGoalImage] = useState(goal?.imagePath || '');

  const saveHabit = () => {
    if (habit) {
      onUpdateHabit({
        ...habit,
        costPerOccurrence: parseFloat(habitCost) || 0,
        frequency: habitFreq,
        timesPerDay: habitFreq === Frequency.MULTIPLE_DAILY ? (parseInt(habitTimesPerDay) || 1) : undefined
      });
      setEditingHabit(false);
    }
  };

  const handleGoalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if(event.target?.result) {
            setGoalImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
  };

  const saveGoal = () => {
      if(goal) {
          onUpdateGoal({
              ...goal,
              name: goalName,
              targetAmount: parseFloat(goalTarget) || 0,
              imagePath: goalImage
          });
          setEditingGoal(false);
      }
  };

  const handleToggleNotifications = async () => {
      if (!settings.dailyReminder) {
          const granted = await requestNotificationPermission();
          if (granted) {
              onUpdateSettings('dailyReminder', true);
              scheduleNotification('Напоминания включены', 'Мы будем напоминать тебе о целях!', 2000);
          } else {
              alert('Не удалось включить уведомления. Проверьте настройки браузера.');
          }
      } else {
          onUpdateSettings('dailyReminder', false);
      }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdateSettings('dailyReminderTime', e.target.value);
  };

  const getFrequencyLabel = (h: Habit) => {
      switch (h.frequency) {
          case Frequency.DAILY:
              return 'День';
          case Frequency.EVERY_2_DAYS:
              return 'Каждые 2 дня';
          case Frequency.WEEKLY:
              return 'в неделю';
          case Frequency.MULTIPLE_DAILY:
              return `${h.timesPerDay || 1} раз(а) в день`;
          default:
              return h.frequency;
      }
  };

  const getHabitLabel = (h: Habit) => {
    if (h.customName) return h.customName;
    switch(h.type) {
        case HabitType.SMOKING: return 'Курение/Вейпинг';
        case HabitType.ALCOHOL: return 'Алкоголь';
        case HabitType.ENERGY_DRINKS: return 'Энергетики';
        case HabitType.FAST_FOOD: return 'Фастфуд';
        case HabitType.OTHER: return 'Другое';
        default: return 'Неизвестно';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto no-scrollbar pb-24 animate-in slide-in-from-right relative">
       <div className="px-6 pt-12 pb-6 bg-white shadow-sm z-10 sticky top-0 flex items-center">
         <h2 className="text-2xl font-bold text-gray-800">Настройки</h2>
       </div>

       <div className="p-6 space-y-6">
            
            {/* Habit Section */}
            <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 ml-2">Моя привычка</h3>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                    {!editingHabit ? (
                        <div className="p-4 flex items-center justify-between border-b border-gray-100">
                            <div>
                                <p className="font-bold text-gray-800">{habit ? getHabitLabel(habit) : ''}</p>
                                <p className="text-sm text-gray-500">{habit?.costPerOccurrence}₽ / {habit ? getFrequencyLabel(habit) : ''}</p>
                            </div>
                            <button onClick={() => setEditingHabit(true)} className="p-2 bg-gray-50 rounded-full text-primary-600"><Edit2 size={16}/></button>
                        </div>
                    ) : (
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="text-xs text-gray-400">Стоимость (₽)</label>
                                <input 
                                    type="number" 
                                    value={habitCost} 
                                    onChange={e => setHabitCost(e.target.value)} 
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400">Частота</label>
                                <select 
                                    value={habitFreq} 
                                    onChange={e => setHabitFreq(e.target.value as Frequency)}
                                    className="w-full p-2 border rounded-lg bg-white text-gray-900"
                                >
                                    <option value={Frequency.DAILY}>Раз в день</option>
                                    <option value={Frequency.MULTIPLE_DAILY}>Несколько раз в день</option>
                                    <option value={Frequency.EVERY_2_DAYS}>Каждые 2 дня</option>
                                    <option value={Frequency.WEEKLY}>Раз в неделю</option>
                                </select>
                            </div>
                            {habitFreq === Frequency.MULTIPLE_DAILY && (
                                <div>
                                    <label className="text-xs text-gray-400">Сколько раз в день?</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        placeholder="5"
                                        value={habitTimesPerDay} 
                                        onChange={e => setHabitTimesPerDay(e.target.value)} 
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                            )}
                            <div className="flex space-x-2">
                                <button onClick={saveHabit} className="flex-1 bg-primary-500 text-white py-2 rounded-lg text-sm font-bold">Сохранить</button>
                                <button onClick={() => setEditingHabit(false)} className="px-4 bg-gray-100 text-gray-500 rounded-lg text-sm">Отмена</button>
                            </div>
                        </div>
                    )}
                </div>
            </section>

             {/* Goal Section */}
             <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 ml-2">Моя цель</h3>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                    {!editingGoal ? (
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3 w-full overflow-hidden">
                                {/* Fixed: Object Contain and Background for Thumbnails */}
                                <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0">
                                   <img src={goal?.imagePath} alt="Goal" className="w-full h-full rounded-lg object-contain" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-gray-800 truncate">{goal?.name}</p>
                                    <p className="text-sm text-gray-500">{goal?.targetAmount.toLocaleString()}₽</p>
                                </div>
                            </div>
                            <button onClick={() => setEditingGoal(true)} className="p-2 bg-gray-50 rounded-full text-primary-600 shrink-0 ml-2"><Edit2 size={16}/></button>
                        </div>
                    ) : (
                         <div className="p-4 space-y-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 rounded-lg bg-gray-100 shrink-0">
                                     <img src={goalImage} className="w-full h-full rounded-lg object-contain" />
                                </div>
                                <label className="flex-1 p-2 border border-dashed rounded-lg text-center text-sm text-gray-500 cursor-pointer">
                                    Сменить фото
                                    <input type="file" className="hidden" accept="image/*" onChange={handleGoalImageUpload} />
                                </label>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400">Название</label>
                                <input 
                                    type="text" 
                                    value={goalName} 
                                    onChange={e => setGoalName(e.target.value)} 
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400">Цена цели (₽)</label>
                                <input 
                                    type="number" 
                                    value={goalTarget} 
                                    onChange={e => setGoalTarget(e.target.value)} 
                                    className="w-full p-2 border rounded-lg"
                                />
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={saveGoal} className="flex-1 bg-primary-500 text-white py-2 rounded-lg text-sm font-bold">Сохранить</button>
                                <button onClick={() => setEditingGoal(false)} className="px-4 bg-gray-100 text-gray-500 rounded-lg text-sm">Отмена</button>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Preferences */}
            <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 ml-2">Настройки приложения</h3>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-100">
                    <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3 text-gray-700">
                            <Bell size={20} />
                            <div>
                                <p>Ежедневные напоминания</p>
                                <p className="text-xs text-gray-400">По умолчанию в 18:00</p>
                            </div>
                        </div>
                        <div 
                            onClick={handleToggleNotifications}
                            className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${settings.dailyReminder ? 'bg-primary-500' : 'bg-gray-200'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${settings.dailyReminder ? 'left-7' : 'left-1'}`}></div>
                        </div>
                    </div>
                    {settings.dailyReminder && (
                        <div className="p-4 flex items-center justify-between bg-gray-50">
                             <div className="flex items-center space-x-2 text-gray-600">
                                <Clock size={16} />
                                <span className="text-sm">Время уведомления</span>
                             </div>
                             <input 
                                type="time" 
                                value={settings.dailyReminderTime || '18:00'}
                                onChange={handleTimeChange}
                                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg p-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                             />
                        </div>
                    )}
                </div>
            </section>

            {/* Danger Zone */}
            <section>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-100">
                    <button onClick={() => {
                        if (navigator.share) {
                            const shareUrl = window.location.protocol.startsWith('http') ? window.location.href : 'https://habithero.app';
                            navigator.share({
                                title: 'HabitHero',
                                text: 'Я коплю на мечту, отказываясь от вредных привычек! Присоединяйся!',
                                url: shareUrl
                            }).catch(err => console.error('Share failed:', err));
                        } else {
                             const shareUrl = window.location.href;
                             try {
                                 navigator.clipboard.writeText(shareUrl);
                                 alert('Ссылка скопирована в буфер обмена!');
                             } catch (e) {
                                 alert('Поделитесь ссылкой: ' + shareUrl);
                             }
                        }
                    }} className="w-full p-4 flex items-center justify-between hover:bg-gray-50 text-left">
                        <div className="flex items-center space-x-3 text-gray-700">
                            <Share2 size={20} />
                            <span>Поделиться</span>
                        </div>
                        <ChevronRight size={16} className="text-gray-400"/>
                    </button>
                    <button 
                        onClick={() => setShowAbout(true)}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 text-left"
                    >
                         <div className="flex items-center space-x-3 text-gray-700">
                            <Info size={20} />
                            <span>О приложении</span>
                        </div>
                         <ChevronRight size={16} className="text-gray-400"/>
                    </button>
                    <button 
                        onClick={() => setShowResetConfirm(true)}
                        className="w-full p-4 flex items-center space-x-3 text-error hover:bg-red-50 text-left"
                    >
                        <Trash2 size={20} />
                        <span>Сбросить все данные</span>
                    </button>
                </div>
            </section>
            
            <p className="text-center text-xs text-gray-400 mt-4">Версия 1.0.4</p>

            {/* Reset Confirmation Modal */}
            {showResetConfirm && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-center mb-4 text-error">
                            <AlertCircle size={48} />
                        </div>
                        <h3 className="text-center text-xl font-bold text-gray-900 mb-2">Сбросить все данные?</h3>
                        <p className="text-center text-gray-500 mb-6">
                            Это действие удалит всю историю, настройки и текущую цель. Это действие <span className="font-bold">необратимо</span>.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setShowResetConfirm(false)} className="py-3 rounded-xl font-bold text-gray-600 bg-gray-100">Отмена</button>
                            <button onClick={onReset} className="py-3 rounded-xl font-bold text-white bg-error shadow-lg shadow-red-500/30">Сбросить</button>
                        </div>
                    </div>
                </div>
            )}

            {/* About Modal */}
            {showAbout && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-200 relative max-h-[85vh] overflow-y-auto no-scrollbar">
                        <button 
                            onClick={() => setShowAbout(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-2"
                        >
                            <X size={24} />
                        </button>
                        
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600 mb-3">
                                <Info size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">HabitHero</h3>
                            <p className="text-sm text-gray-500">твой помощник в борьбе с вредными привычками</p>
                        </div>

                        <div className="space-y-4 text-sm text-gray-600 leading-relaxed mb-6">
                            <p>Мы помогаем не просто отказаться от привычки, а превратить ежедневную экономию в реальные покупки.</p>
                            
                            <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                                <div className="flex items-start space-x-3">
                                    <span className="text-xl">📊</span>
                                    <div>
                                        <p className="font-bold text-gray-800 text-xs uppercase mb-1">Визуализируй прогресс</p>
                                        <p>Смотри не на цифры, а на конкретную цель: iPhone через 18 дней, отпуск через 2 месяца.</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <span className="text-xl">🔥</span>
                                    <div>
                                        <p className="font-bold text-gray-800 text-xs uppercase mb-1">Без наказаний</p>
                                        <p>Срыв не обнуляет прогресс - только отодвигает цель на короткое время.</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <span className="text-xl">💰</span>
                                    <div>
                                        <p className="font-bold text-gray-800 text-xs uppercase mb-1">Реальная экономия</p>
                                        <p>Каждый день без привычки приближает тебя к покупке мечты.</p>
                                    </div>
                                </div>
                            </div>

                            <p className="text-center italic pt-2">Разработано с ❤️ для тех, кто стремится к лучшему</p>
                        </div>

                        <div className="text-center border-t border-gray-100 pt-4 space-y-1">
                            <p className="text-xs text-gray-400">Связь: support@habithero.app</p>
                            <p className="text-xs text-gray-400">Версия: 1.0.4</p>
                        </div>
                    </div>
                </div>
            )}
       </div>
    </div>
  );
};

export default Settings;