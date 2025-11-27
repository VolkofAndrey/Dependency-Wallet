import React, { useState, useEffect } from 'react';
import { AppState } from '../types';
import { calculateDailySavings, calculateDaysRemaining, calculateTotalSaved, calculateStreak, getTodayRecord } from '../services/storageService';
import { Flame, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  state: AppState;
  onCheckIn: (success: boolean) => void;
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

const Dashboard: React.FC<DashboardProps> = ({ state, onCheckIn }) => {
  const { habit, goal, records } = state;
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number }>({ d: 0, h: 0, m: 0 });
  const [showRelapseConfirm, setShowRelapseConfirm] = useState(false);
  const [justCheckedIn, setJustCheckedIn] = useState(false);

  if (!habit || !goal) return null;

  const dailySavings = calculateDailySavings(habit);
  const totalSaved = calculateTotalSaved(records);
  const daysToGoal = calculateDaysRemaining(goal, totalSaved, dailySavings);
  const progressPercent = Math.min(100, (totalSaved / goal.targetAmount) * 100);
  const streak = calculateStreak(records);
  
  const todayRecord = getTodayRecord(records);

  useEffect(() => {
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
  }, [daysToGoal]);

  const handleSuccess = () => {
    onCheckIn(true);
    setJustCheckedIn(true);
    setTimeout(() => setJustCheckedIn(false), 2000);
  };

  const handleRelapse = () => {
    onCheckIn(false);
    setShowRelapseConfirm(false);
  };

  const formatMoney = (amount: number) => {
    return Math.round(amount).toLocaleString('ru-RU');
  };

  const getDailyPhrase = (dateStr: string) => {
    const sum = dateStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return SUCCESS_PHRASES[sum % SUCCESS_PHRASES.length];
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-hidden relative">
      {/* Header */}
      <div className="px-6 pt-8 pb-2 flex justify-between items-center bg-white z-10">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Привет, мечтатель</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 px-4 pt-2">
        
        {/* Main Goal Card - Changed to aspect-square to increase vertical size */}
        <div className="relative w-full aspect-square rounded-[32px] overflow-hidden shadow-xl mb-4 group bg-gray-900">
            {/* Added bg-gray-900 and object-contain to ensure image is visible and not cropped */}
            <img src={goal.imagePath} alt="Goal" className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105" />
            
            {/* Darker overlay for text readability against any background */}
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80"></div>
            
            <div className="absolute top-0 w-full p-6 text-center">
                <p className="text-white/80 font-medium mb-1">До {goal.name} осталось</p>
                <div className="text-white font-bold text-4xl tracking-tight drop-shadow-lg">
                    {timeLeft.d}<span className="text-xl font-normal opacity-70">д</span> : {timeLeft.h}<span className="text-xl font-normal opacity-70">ч</span> : {timeLeft.m}<span className="text-xl font-normal opacity-70">м</span>
                </div>
            </div>

            <div className="absolute bottom-0 w-full p-6">
                <div className="flex justify-between items-end mb-2 text-white">
                    <span className="font-bold text-3xl">{progressPercent.toFixed(1)}%</span>
                    <span className="text-sm opacity-80 mb-1">{totalSaved.toFixed(0)}₽ / {goal.targetAmount.toLocaleString()}₽</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full h-3 bg-white/20 rounded-full backdrop-blur-sm overflow-hidden">
                    <div 
                        className="h-full bg-primary-500 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(76,175,80,0.8)]"
                        style={{ width: `${progressPercent}%` }}
                    ></div>
                </div>
            </div>
        </div>

        {/* Action Area */}
        <div className="flex flex-col items-center space-y-3">
             {!todayRecord ? (
                 <>
                    <button 
                        onClick={handleSuccess}
                        className="w-full py-4 bg-primary-600 rounded-2xl text-white font-bold text-xl shadow-lg shadow-primary-500/30 active:scale-95 transition-all flex items-center justify-center space-x-2"
                    >
                        <CheckCircle2 />
                        <span>Отметить день (+{formatMoney(dailySavings)}₽)</span>
                    </button>
                    
                    <button 
                        onClick={() => setShowRelapseConfirm(true)}
                        className="text-gray-400 font-medium text-sm py-2 px-4 hover:text-error transition-colors"
                    >
                        У меня был срыв
                    </button>
                 </>
             ) : (
                <div className={`w-full py-5 px-4 text-center rounded-2xl flex flex-col items-center justify-center ${todayRecord.isSuccessful ? 'bg-primary-50 border border-primary-200' : 'bg-red-50 border border-red-200'}`}>
                    <h3 className={`font-bold text-lg ${todayRecord.isSuccessful ? 'text-primary-700' : 'text-red-700'}`}>
                        {todayRecord.isSuccessful ? getDailyPhrase(todayRecord.date) : 'Не сдавайся.'}
                    </h3>
                    <p className="text-gray-500 text-sm mt-1">Возвращайся завтра.</p>
                </div>
             )}
        </div>

        {/* Stats Row */}
        <div className="mt-4 grid grid-cols-2 gap-3">
             <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                <div className="flex items-center space-x-2 text-orange-500 mb-1">
                    <Flame fill="currentColor" size={18} />
                    <span className="font-bold text-sm">Серия</span>
                </div>
                <span className="text-xl font-bold text-gray-800">{streak} <span className="text-xs font-normal text-gray-400">дней</span></span>
             </div>
             
             <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                 <p className="text-xs text-gray-500 mb-1">Не куплено</p>
                 <span className="text-lg font-bold text-gray-800 text-center leading-tight">
                    {Math.floor(totalSaved / habit.costPerOccurrence)} <span className="text-xs font-normal text-gray-400">ед.</span>
                 </span>
             </div>
        </div>

      </div>

      {/* Animation Overlay for Success */}
      {justCheckedIn && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
              <div className="text-primary-600 font-bold text-6xl animate-[ping_1s_ease-out_infinite] opacity-50">+{formatMoney(dailySavings)}₽</div>
          </div>
      )}

      {/* Relapse Dialog */}
      {showRelapseConfirm && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-center mb-4 text-error">
                    <AlertCircle size={48} />
                </div>
                <h3 className="text-center text-xl font-bold text-gray-900 mb-2">Ты уверен?</h3>
                <p className="text-center text-gray-500 mb-6">
                    Отметка о срыве приостановит твой прогресс. Твоя цель отдалится примерно на <span className="font-bold text-gray-800">1 день</span>.
                </p>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setShowRelapseConfirm(false)} className="py-3 rounded-xl font-bold text-gray-600 bg-gray-100">Отмена</button>
                    <button onClick={handleRelapse} className="py-3 rounded-xl font-bold text-white bg-error shadow-lg shadow-red-500/30">Подтвердить</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;