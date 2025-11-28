
import React, { useState } from 'react';
import { HabitType, Frequency, Habit, Goal } from '../types';
import { ArrowRight, ArrowLeft, Cigarette, Wine, Zap, Plus, Upload, Check, Sandwich, Coffee } from 'lucide-react';
import { calculateDailySavings, SUGGESTED_GOALS } from '../services/storageService';
import { ASSETS } from '../data/assets';

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
  const [timesPerWeek, setTimesPerWeek] = useState<string>('');
  const [customName, setCustomName] = useState('');

  // State for Goal
  const [goalName, setGoalName] = useState('');
  const [goalCost, setGoalCost] = useState<string>('');
  const [goalImage, setGoalImage] = useState<string>('');
  const [isCustomGoal, setIsCustomGoal] = useState(false);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  // Блокировка ввода спецсимволов и отрицательных знаков
  const preventInvalidInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['-', '+', 'e', 'E'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const getDailyCost = () => {
    const costNum = parseFloat(cost) || 0;
    const timesD = parseInt(timesPerDay) || 1;
    const timesW = parseInt(timesPerWeek) || 1;
    
    const h: Habit = {
      id: 'temp', 
      type: habitType || HabitType.OTHER, 
      costPerOccurrence: costNum, 
      frequency, 
      timesPerDay: timesD, 
      timesPerWeek: timesW,
      createdAt: 0
    };
    return calculateDailySavings(h);
  };

  const isHabitValid = () => {
    if (!habitType || !cost) return false;
    if (habitType === HabitType.OTHER && !customName) return false;
    if (frequency === Frequency.MULTIPLE_DAILY && !timesPerDay) return false;
    if (frequency === Frequency.MULTIPLE_WEEKLY && !timesPerWeek) return false;
    return true;
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
      timesPerWeek: frequency === Frequency.MULTIPLE_WEEKLY ? parseInt(timesPerWeek) : undefined,
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

  const selectSuggestedGoal = (g: typeof SUGGESTED_GOALS[0]) => {
      setGoalName(g.name);
      setGoalCost(g.price.toString());
      setGoalImage(g.img);
      setIsCustomGoal(false);
  };

  // --- Step 1: Welcome ---
  if (step === 1) {
    return (
      <div className="flex flex-col h-full bg-white animate-in fade-in duration-500">
        <div className="pt-6 px-6 pb-2 text-center mt-[20px]">
             <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">Привет, я <span className="text-primary-600">HabitHero</span></h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center w-full relative overflow-hidden">
             {/* Round Image Frame */}
             <div className="w-72 h-72 rounded-full overflow-hidden shadow-xl border-4 border-white mb-6 relative z-10 shrink-0">
                 <img src={ASSETS.HERO} className="w-full h-full object-cover object-center" alt="Dreams" />
             </div>
             
             <div className="w-full px-6 text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                  Не просто бросай — <br/>
                  <span className="text-primary-600">покупай мечты</span>
                </h1>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Каждый день без привычки приближает тебя к осязаемой цели. 
                  HabitHero превращает отказы в реальные покупки.
                </p>
             </div>
        </div>
        
        <div className="w-full px-6 pb-8 pt-2">
            <div className="flex justify-center mb-6 space-x-2">
                <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            </div>
            <button onClick={handleNext} className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform mb-5">
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
                    { type: HabitType.SMOKING, label: 'Курение', icon: <Cigarette /> },
                    { type: HabitType.COFFEE, label: 'Кофе в кафе', icon: <Coffee /> },
                    { type: HabitType.ALCOHOL, label: 'Алкоголь', icon: <Wine /> },
                    { type: HabitType.ENERGY_DRINKS, label: 'Энергетики', icon: <Zap /> },
                    { type: HabitType.FAST_FOOD, label: 'Фастфуд', icon: <Sandwich /> },
                    { type: HabitType.OTHER, label: 'Другое', icon: <Plus /> },
                ].map((item) => (
                    <button
                        key={item.type}
                        onClick={() => {
                            setHabitType(item.type);
                            // Сброс полей при смене типа
                            setCost('');
                            setFrequency(Frequency.DAILY);
                            setTimesPerDay('');
                            setTimesPerWeek('');
                        }}
                        className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                            habitType === item.type 
                            ? 'border-primary-500 bg-primary-50 text-primary-700' 
                            : 'border-gray-100 bg-gray-50 text-gray-500'
                        }`}
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

                    {/* УМНЫЕ ВОПРОСЫ В ЗАВИСИМОСТИ ОТ ПРИВЫЧКИ */}
                    {habitType === HabitType.SMOKING && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Сколько пачек в день?</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    step="0.5"
                                    onKeyDown={preventInvalidInput}
                                    value={timesPerDay}
                                    onChange={(e) => {
                                        setTimesPerDay(e.target.value);
                                        setFrequency(Frequency.MULTIPLE_DAILY);
                                    }}
                                    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="1"
                                />
                                <p className="text-xs text-gray-400 mt-1">💡 Средняя пачка: 200-300₽</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Цена одной пачки (₽)</label>
                                <input 
                                    type="number"
                                    min="0"
                                    onKeyDown={preventInvalidInput}
                                    value={cost}
                                    onChange={(e) => setCost(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="250"
                                />
                            </div>
                        </>
                    )}

                    {habitType === HabitType.COFFEE && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Сколько раз покупаешь кофе в неделю?</label>
                                <input 
                                    type="number"
                                    min="0"
                                    onKeyDown={preventInvalidInput}
                                    value={timesPerWeek}
                                    onChange={(e) => {
                                        setTimesPerWeek(e.target.value);
                                        setFrequency(Frequency.MULTIPLE_WEEKLY);
                                    }}
                                    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="5"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Средняя цена кофе (₽)</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    onKeyDown={preventInvalidInput}
                                    value={cost}
                                    onChange={(e) => setCost(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="300"
                                />
                                <p className="text-xs text-gray-400 mt-1">💡 Starbucks ~350₽, обычная кофейня ~200₽</p>
                            </div>
                        </>
                    )}

                    {habitType === HabitType.FAST_FOOD && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Сколько раз ешь фастфуд в неделю?</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    onKeyDown={preventInvalidInput}
                                    value={timesPerWeek}
                                    onChange={(e) => {
                                        setTimesPerWeek(e.target.value);
                                        setFrequency(Frequency.MULTIPLE_WEEKLY);
                                    }}
                                    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Средний чек (₽)</label>
                                <input 
                                    type="number"
                                    min="0"
                                    onKeyDown={preventInvalidInput}
                                    value={cost}
                                    onChange={(e) => setCost(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="500"
                                />
                                <p className="text-xs text-gray-400 mt-1">💡 McDonald's, KFC, Burger King</p>
                            </div>
                        </>
                    )}

                    {(habitType === HabitType.ALCOHOL || habitType === HabitType.ENERGY_DRINKS) && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Сколько раз в неделю?</label>
                                <input 
                                    type="number"
                                    min="0"
                                    onKeyDown={preventInvalidInput}
                                    value={timesPerWeek}
                                    onChange={(e) => {
                                        setTimesPerWeek(e.target.value);
                                        setFrequency(Frequency.MULTIPLE_WEEKLY);
                                    }}
                                    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Сколько вы тратите за раз (₽)</label>
                                <input 
                                    type="number"
                                    min="0"
                                    onKeyDown={preventInvalidInput}
                                    value={cost}
                                    onChange={(e) => setCost(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder={habitType === HabitType.ALCOHOL ? "800" : "150"}
                                />
                            </div>
                        </>
                    )}

                    {habitType === HabitType.OTHER && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Сколько ты тратишь в день? (₽)</label>
                            <input 
                                type="number" 
                                min="0"
                                onKeyDown={preventInvalidInput}
                                value={cost}
                                onChange={(e) => {
                                    setCost(e.target.value);
                                    setFrequency(Frequency.DAILY);
                                }}
                                className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                placeholder="200"
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
            <div className="flex justify-center mb-6 space-x-2">
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            </div>
            <div className="flex space-x-4 mb-5">
                 <button onClick={handleBack} className="px-6 py-4 text-gray-500 font-bold rounded-xl active:bg-gray-100">Назад</button>
                 <button 
                    onClick={handleNext}
                    disabled={!isHabitValid()}
                    className="flex-1 bg-primary-600 disabled:opacity-50 text-white py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2"
                >
                    <span>Далее</span>
                    <ArrowRight size={20} />
                </button>
            </div>
        </div>
      </div>
    );
  }

  // --- Step 3: Goal Selection ---
  if (step === 3) {
    return (
        <div className="flex flex-col h-full p-6 bg-white animate-in slide-in-from-right duration-300">
            <div className="flex-1 overflow-y-auto no-scrollbar">
                <h2 className="text-2xl font-bold mb-2 text-gray-900">На что копим?</h2>
                <p className="text-gray-500 mb-6">Выбери цель из списка или создай свою мечту.</p>
                
                {!isCustomGoal ? (
                    <>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {SUGGESTED_GOALS.map((g, idx) => (
                                <div 
                                    key={idx} 
                                    onClick={() => selectSuggestedGoal(g)}
                                    className={`relative group rounded-xl overflow-hidden cursor-pointer bg-white shadow-sm transition-all ${
                                        goalName === g.name ? 'border-2 border-primary-500 ring-2 ring-primary-200' : 'border border-gray-100 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="w-full h-24 bg-white p-2 flex items-center justify-center">
                                        <img src={g.img} className="w-full h-full object-contain" alt={g.name} />
                                    </div>
                                    <div className="p-3 border-t border-gray-100 bg-gray-50">
                                        <span className="text-gray-900 font-bold text-xs leading-tight block truncate">{g.name}</span>
                                        <span className="text-gray-500 text-[10px] font-medium">{g.price.toLocaleString()}₽</span>
                                    </div>
                                    {goalName === g.name && <div className="absolute top-2 right-2 bg-primary-500 text-white p-1 rounded-full shadow-md"><Check size={12}/></div>}
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={() => {
                                setIsCustomGoal(true);
                                setGoalName('');
                                setGoalCost('');
                                setGoalImage('');
                            }}
                            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 flex items-center justify-center space-x-2 hover:bg-gray-50 mb-6"
                        >
                            <Upload size={18} />
                            <span>Загрузить свою цель</span>
                        </button>
                    </>
                ) : (
                    <div className="animate-in fade-in">
                        <button onClick={() => setIsCustomGoal(false)} className="text-primary-600 font-medium mb-4 flex items-center text-sm"><ArrowLeft size={16} className="mr-1"/> Выбрать из списка</button>
                        
                        <label className="bg-white h-48 rounded-xl flex flex-col items-center justify-center mb-2 text-gray-400 border-2 border-dashed border-gray-300 cursor-pointer hover:bg-gray-50 transition-colors relative overflow-hidden group">
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
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
                        <p className="text-center text-xs text-gray-400 mb-6">добавь изображение своей цели</p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-gray-500">Название цели</label>
                                <input 
                                    type="text" 
                                    value={goalName} 
                                    onChange={(e) => setGoalName(e.target.value)}
                                    className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="Например: Отпуск"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500">Стоимость (₽)</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    onKeyDown={preventInvalidInput}
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
                <div className="flex justify-center mb-6 space-x-2">
                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                    <div className="w-3 h-3 rounded-full bg-gray-300"></div>
                    <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                </div>
                <div className="flex space-x-4 mb-5">
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
