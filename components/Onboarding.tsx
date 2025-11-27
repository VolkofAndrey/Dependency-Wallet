import React, { useState } from 'react';
import { HabitType, Frequency, Habit, Goal } from '../types';
import { ArrowRight, ArrowLeft, Cigarette, Wine, Zap, Plus, Upload, Check, Sandwich } from 'lucide-react';
import { calculateDailySavings, SUGGESTED_GOALS } from '../services/storageService';

interface OnboardingProps {
  onComplete: (habit: Habit, goal: Goal) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  
  // State for Habit
  const [habitType, setHabitType] = useState<HabitType | null>(null);
  const [cost, setCost] = useState<string>('');
  const [frequency, setFrequency] = useState<Frequency>(Frequency.DAILY);
  const [timesPerDay, setTimesPerDay] = useState<string>('');
  const [customName, setCustomName] = useState('');

  // State for Goal
  const [goalName, setGoalName] = useState('');
  const [goalCost, setGoalCost] = useState<string>('');
  const [goalImage, setGoalImage] = useState<string>('');
  const [isCustomGoal, setIsCustomGoal] = useState(false);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const getDailyCost = () => {
    const costNum = parseFloat(cost) || 0;
    const timesNum = parseInt(timesPerDay) || 1;
    const h: Habit = {
      id: 'temp', type: habitType || HabitType.OTHER, costPerOccurrence: costNum, frequency, timesPerDay: timesNum, createdAt: 0
    };
    return calculateDailySavings(h);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
        alert("Файл слишком большой. Пожалуйста, выберите изображение до 2МБ.");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
          setGoalImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFinish = () => {
    if (!habitType || !cost || !goalName || !goalCost) return;

    const newHabit: Habit = {
      id: Date.now().toString(),
      type: habitType,
      customName: habitType === HabitType.OTHER ? customName : undefined,
      costPerOccurrence: parseFloat(cost),
      frequency: frequency,
      timesPerDay: frequency === Frequency.MULTIPLE_DAILY ? parseInt(timesPerDay) : undefined,
      createdAt: Date.now(),
    };

    const newGoal: Goal = {
      id: Date.now().toString(),
      name: goalName,
      targetAmount: parseFloat(goalCost),
      imagePath: goalImage,
      createdAt: Date.now(),
    };

    onComplete(newHabit, newGoal);
  };

  // --- Step 1: Welcome ---
  if (step === 1) {
    return (
      <div className="flex flex-col h-full p-6 justify-between bg-white text-gray-800 animate-in fade-in duration-500">
        <div className="mt-10 flex flex-col items-center text-center">
          <div className="w-64 h-64 bg-primary-100 rounded-full flex items-center justify-center mb-8 relative overflow-hidden">
             <div className="absolute inset-0 bg-primary-500 opacity-10 animate-pulse"></div>
             <img src="https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80" className="object-cover w-full h-full opacity-90 mix-blend-multiply" alt="Dreams" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Не просто бросай привычку — <br/> <span className="text-primary-600">покупай мечты.</span></h1>
          <p className="text-gray-600 text-lg">Преврати свои вредные привычки в вещи, о которых ты всегда мечтал. Визуализируй цель, а не просто цифры.</p>
        </div>
        <div className="w-full mb-5">
            <div className="flex justify-center mb-4 space-x-2">
                <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            </div>
            <button onClick={handleNext} className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform">
                Начать
            </button>
        </div>
      </div>
    );
  }

  // --- Step 2: Habit Selection ---
  if (step === 2) {
    return (
      <div className="flex flex-col h-full p-6 bg-white animate-in slide-in-from-right duration-300">
        <div className="flex-1 overflow-y-auto no-scrollbar">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">От какой привычки ты хочешь избавиться?</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                    { type: HabitType.SMOKING, label: 'Курение/Вейпинг', icon: <Cigarette /> },
                    { type: HabitType.ALCOHOL, label: 'Алкоголь', icon: <Wine /> },
                    { type: HabitType.ENERGY_DRINKS, label: 'Энергетики', icon: <Zap /> },
                    { type: HabitType.FAST_FOOD, label: 'Фастфуд', icon: <Sandwich /> },
                    { type: HabitType.OTHER, label: 'Другое', icon: <Plus /> },
                ].map((item) => (
                    <button
                        key={item.type}
                        onClick={() => setHabitType(item.type)}
                        className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                            habitType === item.type 
                            ? 'border-primary-500 bg-primary-50 text-primary-700' 
                            : 'border-gray-100 bg-gray-50 text-gray-500'
                        } ${item.type === HabitType.OTHER ? 'col-span-2' : ''}`}
                    >
                        <div className="mb-2 scale-125">{item.icon}</div>
                        <span className="font-medium text-center leading-tight">{item.label}</span>
                    </button>
                ))}
            </div>

            {habitType && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                     {habitType === HabitType.OTHER && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Название привычки</label>
                            <input 
                                type="text" 
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                placeholder="Например: Сладости"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Стоимость за раз (₽)</label>
                        <input 
                            type="number" 
                            value={cost}
                            onChange={(e) => setCost(e.target.value)}
                            className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                            placeholder="0"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Как часто?</label>
                        <select 
                            value={frequency}
                            onChange={(e) => setFrequency(e.target.value as Frequency)}
                            className="w-full p-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                            <option value={Frequency.DAILY}>Раз в день</option>
                            <option value={Frequency.MULTIPLE_DAILY}>Несколько раз в день</option>
                            <option value={Frequency.EVERY_2_DAYS}>Раз в 2 дня</option>
                            <option value={Frequency.WEEKLY}>Раз в неделю</option>
                        </select>
                    </div>

                    {frequency === Frequency.MULTIPLE_DAILY && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Сколько раз в день?</label>
                            <input 
                                type="number" 
                                min="0"
                                value={timesPerDay}
                                onChange={(e) => setTimesPerDay(e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="5"
                            />
                        </div>
                    )}

                    <div className="p-4 bg-primary-600 rounded-xl mt-4 shadow-lg transition-all">
                        <p className="text-center text-white font-medium">
                            Ты тратишь примерно <span className="font-bold text-xl">{(getDailyCost() * 30).toFixed(0)}₽</span> в месяц
                        </p>
                    </div>
                </div>
            )}
        </div>

        <div className="pt-4 border-t border-gray-100 mb-5">
            <div className="flex justify-center mb-4 space-x-2">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            </div>
            <div className="flex space-x-4">
                <button onClick={handleBack} className="px-6 py-4 text-gray-500 font-bold rounded-xl active:bg-gray-100">Назад</button>
                <button 
                    onClick={handleNext} 
                    disabled={!habitType || !cost}
                    className="flex-1 bg-primary-600 disabled:opacity-50 text-white py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all"
                >
                    Далее
                </button>
            </div>
        </div>
      </div>
    );
  }

  // --- Step 3: Goal Setting ---
  if (step === 3) {
    return (
      <div className="flex flex-col h-full p-6 bg-white animate-in slide-in-from-right duration-300">
        <div className="flex-1 overflow-y-auto no-scrollbar">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">На что ты хочешь накопить?</h2>

            {!isCustomGoal ? (
                <>
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {SUGGESTED_GOALS.map((g, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => {
                                    setGoalName(g.name);
                                    setGoalCost(g.price.toString());
                                    setGoalImage(g.img);
                                }}
                                className={`relative group rounded-xl overflow-hidden cursor-pointer border-2 bg-white shadow-sm ${goalName === g.name ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-100'}`}
                            >
                                <div className="w-full h-32 bg-white p-2 flex items-center justify-center">
                                    <img src={g.img} className="w-full h-full object-contain transition-transform group-hover:scale-105" alt={g.name} />
                                </div>
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3 pt-6">
                                    <span className="text-white font-bold text-sm leading-tight block">{g.name}</span>
                                    <span className="text-white/90 text-xs">{g.price.toLocaleString()}₽</span>
                                </div>
                                {goalName === g.name && <div className="absolute top-2 right-2 bg-primary-500 text-white p-1 rounded-full shadow-md"><Check size={12}/></div>}
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={() => setIsCustomGoal(true)}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 flex items-center justify-center space-x-2 hover:bg-gray-50"
                    >
                        <Upload size={18} />
                        <span>Загрузить свою цель</span>
                    </button>
                </>
            ) : (
                <div className="animate-in fade-in">
                    <button onClick={() => setIsCustomGoal(false)} className="text-primary-600 font-medium mb-4 flex items-center"><ArrowLeft size={16} className="mr-1"/> Выбрать из списка</button>
                    
                    {/* Fixed Image Upload Preview */}
                    <label className="bg-white h-48 rounded-xl flex flex-col items-center justify-center mb-4 text-gray-400 border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors relative overflow-hidden group">
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        {goalImage ? (
                             <img src={goalImage} className="w-full h-full object-contain p-2" alt="Preview" />
                        ) : (
                            <>
                                <Upload size={32} className="mb-2"/>
                                <span className="text-sm">Нажми, чтобы загрузить фото</span>
                            </>
                        )}
                        {/* Overlay hint if image exists */}
                        {goalImage && (
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white font-medium">Изменить фото</span>
                            </div>
                        )}
                    </label>

                    <div className="space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Название цели</label>
                            <input 
                                type="text" 
                                value={goalName} 
                                onChange={(e) => setGoalName(e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="Например: Отпуск"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Стоимость (₽)</label>
                            <input 
                                type="number" 
                                value={goalCost}
                                onChange={(e) => setGoalCost(e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="100000"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>

        <div className="pt-4 border-t border-gray-100 mb-5">
            <div className="flex justify-center mb-4 space-x-2">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <div className="w-3 h-3 rounded-full bg-primary-500"></div>
            </div>
            <div className="flex space-x-4">
                 <button onClick={handleBack} className="px-6 py-4 text-gray-500 font-bold rounded-xl active:bg-gray-100">Назад</button>
                 <button 
                    onClick={handleFinish}
                    disabled={!goalName || !goalCost}
                    className="flex-1 bg-primary-600 disabled:opacity-50 text-white py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2"
                >
                    <span>Начать копить!</span>
                    <ArrowRight size={20} />
                </button>
            </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Onboarding;