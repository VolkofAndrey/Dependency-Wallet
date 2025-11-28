
import React, { useState, useEffect, useRef } from 'react';
import { AppState, Goal, AchievedGoal, DailyRecord } from '../types';
import { calculateDailySavings, calculateDaysRemaining, calculateTotalSaved, calculateStreak, getTodayRecord, SUGGESTED_GOALS } from '../services/storageService';
import { getUnlockedAchievements, getNextAchievement, getAchievementsForHabit, calculateCurrentStreak, Achievement } from '../services/achievementService';
import { playSound } from '../services/soundService';
import { Flame, AlertCircle, CheckCircle2, Lock, Share2, Upload, Check, ArrowLeft, ArrowRight } from 'lucide-react';

interface DashboardProps {
  state: AppState;
  onCheckIn: (success: boolean) => void;
  onArchiveGoal: (achievedGoal: AchievedGoal) => void;
  onUpdateGoal: (goal: Goal) => void;
}

const SUCCESS_PHRASES = [
  "Отлично справляешься!",
  "Ты сегодня молодец!",
  "Так держать!",
  "Отличный прогресс!",
  "Ты на верном пути!",
  "Великолепный результат!",
  "Ещё один шаг вперёд — супер!",
  "Мощно идёшь!",
  "С каждым днём лучше!",
  "Сегодня прям блестяще!",
  "Горжусь твоим упорством!",
  "Твой вклад сегодня — топ!",
  "Прекрасное усилие, браво!",
  "У тебя отлично выходит!",
  "Такой прогресс вдохновляет!"
];

// Simple Confetti Component
const Confetti: React.FC = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {Array.from({ length: 50 }).map((_, i) => (
                <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                        backgroundColor: ['#FFC107', '#4CAF50', '#2196F3', '#F44336', '#9C27B0'][Math.floor(Math.random() * 5)],
                        left: `${Math.random() * 100}%`,
                        top: `-10px`,
                        animation: `fall ${Math.random() * 3 + 2}s linear infinite`,
                        animationDelay: `${Math.random() * 2}s`
                    }}
                >
                    <style>{`
                        @keyframes fall {
                            to { transform: translateY(100vh) rotate(720deg); }
                        }
                    `}</style>
                </div>
            ))}
        </div>
    );
};

interface AchievementCardProps {
    ach: Achievement;
    unlockedAchievements: Achievement[];
}

const AchievementCard: React.FC<AchievementCardProps> = ({ ach, unlockedAchievements }) => {
    const isUnlocked = unlockedAchievements.some(u => u.id === ach.id);
    
    return (
      <div 
          className={`relative p-2 rounded-xl border flex flex-col items-center justify-center h-24 shadow-sm transition-all ${
              isUnlocked 
              ? 'bg-gradient-to-br from-primary-50 to-white border-primary-200' 
              : 'bg-gray-50 border-gray-100 opacity-80'
          }`}
      >
          <span className={`text-2xl mb-1 ${isUnlocked ? '' : 'grayscale opacity-50'}`}>{ach.icon}</span>
          <span className={`text-[9px] text-center font-bold leading-tight line-clamp-2 ${isUnlocked ? 'text-gray-800' : 'text-gray-400'}`}>
              {ach.title}
          </span>
          <span className="text-[8px] text-gray-400 mt-1">{ach.target} дн.</span>
          
          {!isUnlocked && (
              <div className="absolute top-1 right-1 text-gray-300">
                  <Lock size={10} />
              </div>
          )}
      </div>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ state, onCheckIn, onArchiveGoal, onUpdateGoal }) => {
  const { habit, goal, records } = state;
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number }>({ d: 0, h: 0, m: 0 });
  const [showRelapseConfirm, setShowRelapseConfirm] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const [showNewAchievement, setShowNewAchievement] = useState<Achievement | null>(null);
  const [showGoalAchieved, setShowGoalAchieved] = useState(false);
  
  // New Goal Selection State
  const [isCustomGoal, setIsCustomGoal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalImage, setNewGoalImage] = useState('');

  const prevUnlockedCount = useRef(0);

  // Initial ref setup
  useEffect(() => {
     if (habit) {
         const unlocked = getUnlockedAchievements(habit.type, records);
         prevUnlockedCount.current = unlocked.length;
     }
  }, []);

  // Timer Effect
  useEffect(() => {
    if (!goal || !habit) return;
    const dailySavings = calculateDailySavings(habit);
    const totalSaved = calculateTotalSaved(records);
    const daysToGoal = calculateDaysRemaining(goal, totalSaved, dailySavings);

    const updateTimer = () => {
        const now = new Date();
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);
        const msToMidnight = endOfDay.getTime() - now.getTime();
        
        const totalMsRemaining = ((daysToGoal - 1) * 24 * 60 * 60 * 1000) + msToMidnight;
        
        if (totalMsRemaining <= 0) {
             setTimeLeft({ d: 0, h: 0, m: 0 });
             return;
        }

        const d = Math.floor(totalMsRemaining / (1000 * 60 * 60 * 24));
        const h = Math.floor((totalMsRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((totalMsRemaining % (1000 * 60 * 60)) / (1000 * 60));

        setTimeLeft({ d, h, m });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); 
    return () => clearInterval(interval);
  }, [goal, records, habit]);

  // Achievement Detection
  const unlockedAchievements = habit ? getUnlockedAchievements(habit.type, records) : [];
  useEffect(() => {
      if (unlockedAchievements.length > prevUnlockedCount.current) {
          const newAch = unlockedAchievements[unlockedAchievements.length - 1];
          setShowNewAchievement(newAch);
          playSound('achievement');
          if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
          setTimeout(() => setShowNewAchievement(null), 5000);
      }
      prevUnlockedCount.current = unlockedAchievements.length;
  }, [unlockedAchievements.length]);

  if (!habit) return null;

  // Если цель не установлена (например, после достижения), показываем выбор новой цели
  if (!goal) {
      const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => { if(event.target?.result) setNewGoalImage(event.target.result as string); };
        reader.readAsDataURL(file);
      };

      const handleSaveNewGoal = () => {
          if (!newGoalName || !newGoalTarget) return;
          const newG: Goal = {
              id: Date.now().toString(),
              name: newGoalName,
              targetAmount: parseFloat(newGoalTarget),
              imagePath: newGoalImage,
              createdAt: Date.now()
          };
          onUpdateGoal(newG);
          // Reset local state
          setNewGoalName(''); setNewGoalTarget(''); setNewGoalImage(''); setIsCustomGoal(false);
      };

      return (
          <div className="flex flex-col h-full bg-gray-50 overflow-y-auto no-scrollbar p-6">
              <h2 className="text-2xl font-bold mb-2 text-gray-900 mt-8">Выбери новую цель</h2>
              <p className="text-gray-500 mb-6">Ты отлично справился! Продолжай копить на следующую мечту.</p>
              
              {!isCustomGoal ? (
                <>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {SUGGESTED_GOALS.map((g, idx) => (
                            <div key={idx} onClick={() => { setNewGoalName(g.name); setNewGoalTarget(g.price.toString()); setNewGoalImage(g.img); }}
                                className={`relative group rounded-xl overflow-hidden cursor-pointer bg-white shadow-sm transition-all ${newGoalName === g.name ? 'border-2 border-primary-500' : 'border border-gray-100'}`}
                            >
                                <div className="w-full h-24 bg-white p-2 flex items-center justify-center">
                                    <img src={g.img} className="w-full h-full object-contain" alt={g.name} />
                                </div>
                                <div className="p-3 border-t border-gray-100 bg-gray-50">
                                    <span className="text-gray-900 font-bold text-xs leading-tight block truncate">{g.name}</span>
                                    <span className="text-gray-500 text-[10px] font-medium">{g.price.toLocaleString()}₽</span>
                                </div>
                                {newGoalName === g.name && <div className="absolute top-2 right-2 bg-primary-500 text-white p-1 rounded-full shadow-md"><Check size={12}/></div>}
                            </div>
                        ))}
                    </div>
                    <button onClick={() => { setIsCustomGoal(true); setNewGoalName(''); setNewGoalTarget(''); setNewGoalImage(''); }} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 flex items-center justify-center space-x-2">
                        <Upload size={18} /><span>Загрузить свою цель</span>
                    </button>
                    
                    <button 
                        onClick={handleSaveNewGoal} 
                        disabled={!newGoalName || !newGoalTarget} 
                        className="w-full py-4 mt-6 bg-primary-600 disabled:opacity-50 text-white rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2"
                    >
                        <span>Начать копить!</span>
                        <ArrowRight size={20} />
                    </button>
                </>
              ) : (
                  <div className="animate-in fade-in">
                        <button onClick={() => setIsCustomGoal(false)} className="text-primary-600 font-medium mb-4 flex items-center text-sm"><ArrowLeft size={16} className="mr-1"/> Выбрать из списка</button>
                        <label className="bg-white h-48 rounded-xl flex flex-col items-center justify-center mb-4 border-2 border-dashed border-gray-300 cursor-pointer">
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            {newGoalImage ? <img src={newGoalImage} className="w-full h-full object-contain p-2" /> : <div className="text-center"><Upload size={32} className="mx-auto mb-2 text-gray-400"/><span className="text-xs text-gray-400">Загрузить фото</span></div>}
                        </label>
                        <input type="text" value={newGoalName} onChange={(e) => setNewGoalName(e.target.value)} className="w-full p-3 mb-3 rounded-xl border border-gray-300 outline-none" placeholder="Название цели" />
                        <input type="number" value={newGoalTarget} onChange={(e) => setNewGoalTarget(e.target.value)} className="w-full p-3 mb-4 rounded-xl border border-gray-300 outline-none" placeholder="Стоимость (₽)" />
                        
                        <button 
                            onClick={handleSaveNewGoal} 
                            disabled={!newGoalName || !newGoalTarget} 
                            className="w-full py-4 mt-6 bg-primary-600 disabled:opacity-50 text-white rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2"
                        >
                            <span>Начать копить!</span>
                            <ArrowRight size={20} />
                        </button>
                  </div>
              )}
          </div>
      );
  }

  const dailySavings = calculateDailySavings(habit);
  const totalSaved = calculateTotalSaved(records);
  const progressPercent = Math.min(100, (totalSaved / goal.targetAmount) * 100);
  const streak = calculateStreak(records);
  const todayRecord = getTodayRecord(records);
  const allAchievements = getAchievementsForHabit(habit.type);
  const nextAchievement = getNextAchievement(habit.type, records);
  const commonAchievements = allAchievements.filter(a => a.category === 'common');
  const specificAchievements = allAchievements.filter(a => a.category === 'specific');

  const handleSuccess = () => {
    // Check for goal achievement
    const potentialTotal = totalSaved + dailySavings;
    if (potentialTotal >= goal.targetAmount && totalSaved < goal.targetAmount) {
        playSound('victory');
        if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
        setTimeout(() => setShowGoalAchieved(true), 1000);
    } else {
        playSound('success');
        if (navigator.vibrate) navigator.vibrate(50);
    }
    
    // Save current achievement count
    prevUnlockedCount.current = unlockedAchievements.length;
    
    onCheckIn(true);
    setJustCheckedIn(true);
    setTimeout(() => setJustCheckedIn(false), 2000);
  };

  const handleRelapse = () => {
    onCheckIn(false);
    setShowRelapseConfirm(false);
    playSound('fail');
    if (navigator.vibrate) navigator.vibrate(500);
  };

  const handleShareSuccess = () => {
      const text = `🎉 Я достиг своей цели в HabitHero!\n✅ ${goal.name}\n💰 Накоплено: ${totalSaved.toFixed(0)}₽\nПопробуй и ты!`;
      if (navigator.share) {
          navigator.share({ title: 'Моё достижение', text: text, url: 'https://habithero.app' });
      } else {
          try { navigator.clipboard.writeText(text); alert('Текст скопирован!'); } catch(e) {}
      }
  };

  const handleSetNewGoal = () => {
      // Archive current goal
      const achieved: AchievedGoal = {
          ...goal,
          achievedAt: Date.now(),
          daysToAchieve: records.filter(r => r.isSuccessful).length,
          amountSaved: totalSaved
      };
      onArchiveGoal(achieved);
      setShowGoalAchieved(false);
  };

  const formatMoney = (amount: number) => Math.round(amount).toLocaleString('ru-RU');
  const getDailyPhrase = (dateStr: string) => SUCCESS_PHRASES[dateStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % SUCCESS_PHRASES.length];
  const getAchievementProgress = (ach: Achievement) => ach.id === 'week_streak' ? calculateCurrentStreak(records) : records.filter(r => r.isSuccessful).length;

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden relative">
      {/* Header */}
      <div className="px-6 pt-8 pb-2 flex justify-between items-center bg-white z-10">
        <div><h2 className="text-2xl font-bold text-gray-800">Привет, мечтатель</h2></div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 px-4 pt-2">
        {/* Main Goal Card */}
        <div className="relative w-full aspect-square rounded-[32px] overflow-hidden shadow-sm mb-4 group bg-white border border-gray-100">
            <div className="absolute inset-0 p-8 flex items-center justify-center">
                 <img src={goal.imagePath} alt="Goal" className="w-full h-full object-contain" />
            </div>
            {/* Timer */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-auto max-w-[90%] z-10">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-3 py-1.5 shadow-sm border border-white/50 text-center">
                    <p className="text-gray-600 text-xs font-medium mb-1 uppercase tracking-wide">До {goal.name} осталось</p>
                    <div className="text-gray-900 font-bold text-3xl tracking-tight whitespace-nowrap">
                        {timeLeft.d}<span className="text-sm font-normal text-gray-500 ml-0.5 mr-2">д</span>
                        {timeLeft.h}<span className="text-sm font-normal text-gray-500 ml-0.5 mr-2">ч</span>
                        {timeLeft.m}<span className="text-sm font-normal text-gray-500 ml-0.5">м</span>
                    </div>
                </div>
            </div>
            {/* Progress */}
            <div className="absolute bottom-4 inset-x-4 z-10">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-2 shadow-sm border border-white/50">
                    <div className="flex justify-between items-end mb-2">
                        <span className="font-bold text-2xl text-primary-600">{progressPercent.toFixed(1)}%</span>
                        <span className="text-sm text-gray-600 mb-1 font-medium">{totalSaved.toFixed(0)}₽ / {goal.targetAmount.toLocaleString()}₽</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(76,175,80,0.4)]" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Action Area */}
        <div className="flex flex-col items-center space-y-3">
             {!todayRecord ? (
                 <>
                    <button onClick={handleSuccess} className="w-full py-4 bg-primary-600 rounded-2xl text-white font-bold text-xl shadow-lg shadow-primary-500/30 active:scale-95 transition-all flex items-center justify-center space-x-2">
                        <CheckCircle2 /><span>Отметить день (+{formatMoney(dailySavings)}₽)</span>
                    </button>
                    <button onClick={() => setShowRelapseConfirm(true)} className="text-gray-400 font-medium text-sm py-2 px-4 hover:text-error transition-colors">У меня был срыв</button>
                 </>
             ) : (
                <div className={`w-full py-5 px-4 text-center rounded-2xl flex flex-col items-center justify-center ${todayRecord.isSuccessful ? 'bg-primary-50 border border-primary-200' : 'bg-red-50 border border-red-200'}`}>
                    <h3 className={`font-bold text-lg ${todayRecord.isSuccessful ? 'text-primary-700' : 'text-red-700'}`}>{todayRecord.isSuccessful ? getDailyPhrase(todayRecord.date) : 'Не сдавайся.'}</h3>
                    <p className="text-gray-500 text-sm mt-1">Возвращайся завтра.</p>
                </div>
             )}
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3">
             <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                <div className="flex items-center space-x-2 text-orange-500 mb-1"><Flame fill="currentColor" size={18} /><span className="font-bold text-sm">Серия</span></div>
                <span className="text-xl font-bold text-gray-800">{streak} <span className="text-xs font-normal text-gray-400">дней</span></span>
             </div>
             <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                 <p className="text-xs text-gray-500 mb-1">Достижения</p>
                 <div className="flex items-center space-x-1"><span className="text-2xl font-bold text-primary-600">{unlockedAchievements.length}</span><span className="text-xs text-gray-400">/ {allAchievements.length}</span></div>
             </div>
        </div>

        {/* Achievements */}
        <div className="mt-4 bg-white rounded-3xl shadow-sm p-5 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center">🏆 Твои достижения</h3>
            <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2">{commonAchievements.map(ach => (<AchievementCard key={ach.id} ach={ach} unlockedAchievements={unlockedAchievements} />))}</div>
                <div className="grid grid-cols-2 gap-2">{specificAchievements.map(ach => (<AchievementCard key={ach.id} ach={ach} unlockedAchievements={unlockedAchievements} />))}</div>
                {nextAchievement && (
                    <div className="pt-3 border-t border-gray-100 mt-2">
                        <div className="flex justify-between items-center mb-1"><span className="text-xs text-gray-500">До «{nextAchievement.title}»</span><span className="text-xs font-bold text-primary-600">{getAchievementProgress(nextAchievement)} / {nextAchievement.target}</span></div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-primary-500 transition-all" style={{ width: `${Math.min(100, (getAchievementProgress(nextAchievement) / nextAchievement.target) * 100)}%` }}></div></div>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Success Animation */}
      {justCheckedIn && <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"><div className="text-primary-600 font-bold text-6xl animate-[ping_1s_ease-out_infinite] opacity-50">+{formatMoney(dailySavings)}₽</div></div>}

      {/* Achievement Popup */}
      {showNewAchievement && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-xs px-4 pointer-events-none">
              <div className="bg-white/90 backdrop-blur-md text-gray-900 p-6 rounded-3xl shadow-2xl border-4 border-yellow-400 animate-in zoom-in-95 duration-500 flex flex-col items-center text-center">
                  <div className="text-6xl mb-4 animate-bounce">{showNewAchievement.icon}</div>
                  <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-1">Новое достижение!</p>
                  <h3 className="text-2xl font-black mb-2">{showNewAchievement.title}</h3>
                  <p className="text-gray-500 text-sm">{showNewAchievement.description}</p>
              </div>
          </div>
      )}
      
      {/* Relapse Dialog */}
      {showRelapseConfirm && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-center mb-4 text-error"><AlertCircle size={48} /></div>
                <h3 className="text-center text-xl font-bold text-gray-900 mb-2">Ты уверен?</h3>
                <p className="text-center text-gray-500 mb-6">Отметка о срыве приостановит твой прогресс.</p>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowRelapseConfirm(false)} className="py-3 rounded-xl font-bold text-gray-600 bg-gray-100">Отмена</button>
                    <button onClick={handleRelapse} className="py-3 rounded-xl font-bold text-white bg-error shadow-lg shadow-red-500/30">Подтвердить</button>
                </div>
            </div>
        </div>
      )}

      {/* Goal Achieved Modal */}
      {showGoalAchieved && (
        <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
            <Confetti />
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-500 relative">
                <div className="flex justify-center mb-4"><div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce"><span className="text-5xl">🎉</span></div></div>
                <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">Поздравляем!</h2>
                <p className="text-center text-gray-600 mb-6">Ты достиг своей цели</p>
                <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-4 border-4 border-primary-500">
                    <img src={goal.imagePath} alt={goal.name} className="w-full h-full object-contain bg-white" />
                </div>
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">{goal.name}</h3>
                    <p className="text-3xl font-bold text-primary-600">{totalSaved.toFixed(0)}₽</p>
                </div>
                <div className="space-y-3">
                    <button onClick={handleShareSuccess} className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold flex items-center justify-center space-x-2"><Share2 size={20} /><span>Поделиться успехом</span></button>
                    <button onClick={handleSetNewGoal} className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold">Установить новую цель</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
