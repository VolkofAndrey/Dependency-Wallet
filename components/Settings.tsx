
import React, { useState } from 'react';
import { AppState, Habit, Goal, HabitType, Frequency } from '../types';
import { Trash2, Bell, Share2, Info, ChevronRight, Edit2, AlertCircle, X, Clock, Mail, Upload, Plus, Cigarette, Coffee, Wine, Zap, Sandwich } from 'lucide-react';
import { requestNotificationPermission, scheduleNotification } from '../services/notificationService';
import { calculateDailySavings } from '../services/storageService';

interface SettingsProps {
  state: AppState;
  onReset: () => void;
  onUpdateHabit: (habit: Habit | null) => void;
  onUpdateGoal: (goal: Goal) => void;
  onUpdateSettings: (key: string, value: any) => void;
}

const Settings: React.FC<SettingsProps> = ({ state, onReset, onUpdateHabit, onUpdateGoal, onUpdateSettings }) => {
  const { habit, goal, settings } = state;
  const [editingGoal, setEditingGoal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteHabitConfirm, setShowDeleteHabitConfirm] = useState(false); // New state for delete confirmation
  const [showAbout, setShowAbout] = useState(false);

  // Add Habit State (similar to Onboarding)
  const [isAddingHabit, setIsAddingHabit] = useState(false);
  const [newHabitType, setNewHabitType] = useState<HabitType | null>(null);
  const [newCost, setNewCost] = useState('');
  const [newFreq, setNewFreq] = useState<Frequency>(Frequency.DAILY);
  const [newTimesPerDay, setNewTimesPerDay] = useState('');
  const [newTimesPerWeek, setNewTimesPerWeek] = useState('');
  const [newCustomName, setNewCustomName] = useState('');

  // Edit Goal State
  const [goalName, setGoalName] = useState(goal?.name || '');
  const [goalTarget, setGoalTarget] = useState(goal?.targetAmount.toString() || '');
  const [goalImage, setGoalImage] = useState(goal?.imagePath || '');

  // Validation helper
  const preventInvalidInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['-', '+', 'e', 'E'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleDeleteHabitClick = () => {
      setShowDeleteHabitConfirm(true);
  };

  const confirmDeleteHabit = () => {
      onUpdateHabit(null);
      // Reset add habit form
      setIsAddingHabit(false);
      setNewHabitType(null);
      setNewCost('');
      setNewTimesPerDay('');
      setNewTimesPerWeek('');
      setShowDeleteHabitConfirm(false);
  };

  const getDailyCostForPreview = () => {
    const costNum = parseFloat(newCost) || 0;
    const timesD = parseInt(newTimesPerDay) || 1;
    const timesW = parseInt(newTimesPerWeek) || 1;
    
    const h: Habit = {
      id: 'temp', 
      type: newHabitType || HabitType.OTHER, 
      costPerOccurrence: costNum, 
      frequency: newFreq, 
      timesPerDay: timesD, 
      timesPerWeek: timesW,
      createdAt: 0
    };
    return calculateDailySavings(h);
  };

  const handleSaveNewHabit = () => {
    if (!newHabitType || !newCost) return;

    const newHabit: Habit = {
      id: Date.now().toString(),
      type: newHabitType,
      customName: newHabitType === HabitType.OTHER ? newCustomName : undefined,
      costPerOccurrence: parseFloat(newCost),
      frequency: newFreq,
      timesPerDay: newFreq === Frequency.MULTIPLE_DAILY ? parseInt(newTimesPerDay) : undefined,
      timesPerWeek: newFreq === Frequency.MULTIPLE_WEEKLY ? parseInt(newTimesPerWeek) : undefined,
      createdAt: Date.now(),
    };

    onUpdateHabit(newHabit);
    setIsAddingHabit(false);
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
              if (Notification.permission === 'denied') {
                  alert('Уведомления заблокированы в браузере. Пожалуйста, разрешите их в настройках сайта (значок замка в адресной строке).');
              } else {
                  alert('Не удалось включить уведомления. Проверьте настройки браузера.');
              }
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
          case Frequency.WEEKLY:
              return 'Раз в неделю';
          case Frequency.MULTIPLE_DAILY:
              return `${h.timesPerDay || 1} раз(а) в день`;
          case Frequency.MULTIPLE_WEEKLY:
              return `${h.timesPerWeek || 1} раз(а) в неделю`;
          default:
              return h.frequency;
      }
  };

  const getHabitLabel = (h: Habit) => {
    if (h.customName) return h.customName;
    switch(h.type) {
        case HabitType.SMOKING: return 'Курение';
        case HabitType.COFFEE: return 'Кофе в кафе';
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
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 ml-2">Какую привычку бросаю</h3>
                
                {habit ? (
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-4 flex items-center justify-between border-b border-gray-100">
                            <div>
                                <p className="font-bold text-gray-800">{getHabitLabel(habit)}</p>
                                <p className="text-sm text-gray-500">{habit.costPerOccurrence}₽ / {getFrequencyLabel(habit)}</p>
                            </div>
                            <button onClick={handleDeleteHabitClick} className="p-3 bg-red-50 rounded-full text-error hover:bg-red-100 transition-colors">
                                <Trash2 size={18}/>
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {!isAddingHabit ? (
                            <button 
                                onClick={() => setIsAddingHabit(true)}
                                className="w-full py-4 bg-primary-600 rounded-2xl text-white font-bold text-lg shadow-lg shadow-primary-500/30 active:scale-95 transition-all flex items-center justify-center space-x-2"
                            >
                                <Plus size={24} />
                                <span>Добавить привычку</span>
                            </button>
                        ) : (
                            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4 animate-in fade-in">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="font-bold text-gray-800">Создание привычки</h4>
                                    <button onClick={() => setIsAddingHabit(false)} className="text-gray-400"><X size={20}/></button>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { type: HabitType.SMOKING, label: 'Курение', icon: <Cigarette size={20}/> },
                                        { type: HabitType.COFFEE, label: 'Кофе', icon: <Coffee size={20}/> },
                                        { type: HabitType.ALCOHOL, label: 'Алкоголь', icon: <Wine size={20}/> },
                                        { type: HabitType.ENERGY_DRINKS, label: 'Энергетики', icon: <Zap size={20}/> },
                                        { type: HabitType.FAST_FOOD, label: 'Фастфуд', icon: <Sandwich size={20}/> },
                                        { type: HabitType.OTHER, label: 'Другое', icon: <Plus size={20}/> },
                                    ].map((item) => (
                                        <button
                                            key={item.type}
                                            onClick={() => {
                                                setNewHabitType(item.type);
                                                setNewCost('');
                                                setNewFreq(Frequency.DAILY);
                                                setNewTimesPerDay('');
                                                setNewTimesPerWeek('');
                                            }}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-xs font-medium ${
                                                newHabitType === item.type 
                                                ? 'border-primary-500 bg-primary-50 text-primary-700' 
                                                : 'border-gray-100 bg-gray-50 text-gray-500'
                                            }`}
                                        >
                                            <div className="mb-1">{item.icon}</div>
                                            <span>{item.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {newHabitType && (
                                    <div className="space-y-3 pt-2">
                                        {newHabitType === HabitType.OTHER && (
                                            <div>
                                                <label className="text-xs font-medium text-gray-500">Название</label>
                                                <input 
                                                    type="text" 
                                                    value={newCustomName}
                                                    onChange={(e) => setNewCustomName(e.target.value)}
                                                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary-500"
                                                    placeholder="Например: Сладости"
                                                />
                                            </div>
                                        )}

                                        {newHabitType === HabitType.SMOKING && (
                                            <>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500">Пачек в день</label>
                                                    <input 
                                                        type="number" step="0.5" min="0" onKeyDown={preventInvalidInput}
                                                        value={newTimesPerDay}
                                                        onChange={(e) => { setNewTimesPerDay(e.target.value); setNewFreq(Frequency.MULTIPLE_DAILY); }}
                                                        className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary-500"
                                                        placeholder="1"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500">Цена пачки (₽)</label>
                                                    <input 
                                                        type="number" min="0" onKeyDown={preventInvalidInput}
                                                        value={newCost}
                                                        onChange={(e) => setNewCost(e.target.value)}
                                                        className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary-500"
                                                        placeholder="250"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {newHabitType === HabitType.COFFEE && (
                                            <>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500">Кофе в неделю</label>
                                                    <input 
                                                        type="number" min="0" onKeyDown={preventInvalidInput}
                                                        value={newTimesPerWeek}
                                                        onChange={(e) => { setNewTimesPerWeek(e.target.value); setNewFreq(Frequency.MULTIPLE_WEEKLY); }}
                                                        className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary-500"
                                                        placeholder="5"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500">Цена кофе (₽)</label>
                                                    <input 
                                                        type="number" min="0" onKeyDown={preventInvalidInput}
                                                        value={newCost}
                                                        onChange={(e) => setNewCost(e.target.value)}
                                                        className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary-500"
                                                        placeholder="300"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {newHabitType === HabitType.FAST_FOOD && (
                                            <>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500">Фастфуд в неделю</label>
                                                    <input 
                                                        type="number" min="0" onKeyDown={preventInvalidInput}
                                                        value={newTimesPerWeek}
                                                        onChange={(e) => { setNewTimesPerWeek(e.target.value); setNewFreq(Frequency.MULTIPLE_WEEKLY); }}
                                                        className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary-500"
                                                        placeholder="3"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500">Средний чек (₽)</label>
                                                    <input 
                                                        type="number" min="0" onKeyDown={preventInvalidInput}
                                                        value={newCost}
                                                        onChange={(e) => setNewCost(e.target.value)}
                                                        className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary-500"
                                                        placeholder="500"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {(newHabitType === HabitType.ALCOHOL || newHabitType === HabitType.ENERGY_DRINKS) && (
                                            <>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500">Сколько раз в неделю?</label>
                                                    <input 
                                                        type="number" min="0" onKeyDown={preventInvalidInput}
                                                        value={newTimesPerWeek}
                                                        onChange={(e) => { setNewTimesPerWeek(e.target.value); setNewFreq(Frequency.MULTIPLE_WEEKLY); }}
                                                        className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary-500"
                                                        placeholder="2"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-medium text-gray-500">Сумма за раз (₽)</label>
                                                    <input 
                                                        type="number" min="0" onKeyDown={preventInvalidInput}
                                                        value={newCost}
                                                        onChange={(e) => setNewCost(e.target.value)}
                                                        className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary-500"
                                                        placeholder="500"
                                                    />
                                                </div>
                                            </>
                                        )}

                                        {newHabitType === HabitType.OTHER && (
                                            <div>
                                                <label className="text-xs font-medium text-gray-500">Траты в день (₽)</label>
                                                <input 
                                                    type="number" min="0" onKeyDown={preventInvalidInput}
                                                    value={newCost}
                                                    onChange={(e) => { setNewCost(e.target.value); setNewFreq(Frequency.DAILY); }}
                                                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-primary-500"
                                                    placeholder="200"
                                                />
                                            </div>
                                        )}

                                        <div className="p-3 bg-primary-50 rounded-xl">
                                            <p className="text-center text-primary-800 text-sm">
                                                ~ <span className="font-bold">{(getDailyCostForPreview() * 30).toFixed(0)}₽</span> в месяц
                                            </p>
                                        </div>

                                        <button 
                                            onClick={handleSaveNewHabit}
                                            disabled={!newCost}
                                            className="w-full py-3 bg-primary-600 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
                                        >
                                            Сохранить привычку
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </section>

             {/* Goal Section */}
             <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 ml-2">Моя цель</h3>
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                    {!editingGoal ? (
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3 w-full overflow-hidden">
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
                            
                            <label className="bg-white h-48 rounded-xl flex flex-col items-center justify-center mb-2 text-gray-400 border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors relative overflow-hidden group">
                                <input type="file" accept="image/*" onChange={handleGoalImageUpload} className="hidden" />
                                {goalImage ? (
                                     <img src={goalImage} className="w-full h-full object-contain p-2" alt="Preview" />
                                ) : (
                                    <>
                                        <Upload size={32} className="mb-2"/>
                                        <span className="text-sm">Нажми, чтобы загрузить фото</span>
                                    </>
                                )}
                                {goalImage && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white font-medium">Изменить фото</span>
                                    </div>
                                )}
                            </label>

                            <div>
                                <label className="text-xs text-gray-400">Название</label>
                                <input 
                                    type="text" 
                                    value={goalName} 
                                    onChange={e => setGoalName(e.target.value)} 
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400">Цена цели (₽)</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    onKeyDown={preventInvalidInput}
                                    value={goalTarget} 
                                    onChange={e => setGoalTarget(e.target.value)} 
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>
                            <div className="flex space-x-2 pt-2">
                                <button onClick={saveGoal} className="flex-1 bg-primary-500 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-primary-500/20">Сохранить</button>
                                <button onClick={() => setEditingGoal(false)} className="px-6 bg-gray-100 text-gray-500 rounded-xl text-sm font-bold">Отмена</button>
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
                        onClick={() => window.location.href = 'mailto:support@habithero.app'}
                        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 text-left"
                    >
                         <div className="flex items-center space-x-3 text-gray-700">
                            <Mail size={20} />
                            <span>Связь с разработчиком</span>
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

            {/* Delete Habit Confirmation Modal */}
            {showDeleteHabitConfirm && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-center mb-4 text-error">
                            <AlertCircle size={48} />
                        </div>
                        <h3 className="text-center text-xl font-bold text-gray-900 mb-2">Удалить привычку?</h3>
                        <p className="text-center text-gray-500 mb-6">
                            Ты уверен, что хочешь удалить текущую привычку? Статистика по ней может быть потеряна.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setShowDeleteHabitConfirm(false)} className="py-3 rounded-xl font-bold text-gray-600 bg-gray-100">Отмена</button>
                            <button onClick={confirmDeleteHabit} className="py-3 rounded-xl font-bold text-white bg-error shadow-lg shadow-red-500/30">Удалить</button>
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
                    </div>
                </div>
            )}
       </div>
    </div>
  );
};

export default Settings;
