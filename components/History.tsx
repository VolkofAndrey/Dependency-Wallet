
import React from 'react';
import { AppState } from '../types';
import { calculateTotalSaved } from '../services/storageService';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';

interface HistoryProps {
  state: AppState;
}

const History: React.FC<HistoryProps> = ({ state }) => {
  const { records, habit, achievedGoals } = state;
  if (!habit) return null;

  const totalSaved = calculateTotalSaved(records);
  const successfulDays = records.filter(r => r.isSuccessful).length;

  // Prepare Chart Data (Last 14 days for more compact view)
  const getChartData = () => {
      const data = [];
      let accumulated = 0;
      const today = new Date();
      for (let i = 13; i >= 0; i--) {
          const d = new Date();
          d.setDate(today.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          
          // Find record
          const rec = records.find(r => r.date === dateStr);
          if (rec && rec.isSuccessful) {
              accumulated += rec.amountSaved;
          }
          data.push({
              name: `${d.getDate()}.${String(d.getMonth()+1).padStart(2, '0')}`,
              amount: accumulated
          });
      }
      return data;
  };

  const chartData = getChartData();

  // Calendar Generation
  const renderCalendar = () => {
    const days = [];
    const date = new Date();
    const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    
    // Получаем день недели 1-го числа месяца (0-вс, 1-пн ... 6-сб)
    const firstDayRaw = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    // Конвертируем в формат Пн=0 ... Вс=6
    const firstDay = firstDayRaw === 0 ? 6 : firstDayRaw - 1;

    // Empty slots for start of month
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const localDate = new Date(date.getFullYear(), date.getMonth(), i);
        const yyyy = localDate.getFullYear();
        const mm = String(localDate.getMonth() + 1).padStart(2, '0');
        const dd = String(localDate.getDate()).padStart(2, '0');
        const fmtDate = `${yyyy}-${mm}-${dd}`;
        
        const record = records.find(r => r.date === fmtDate);
        let bgClass = 'bg-gray-100 text-gray-400';
        if (record) {
            bgClass = record.isSuccessful ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30' : 'bg-error text-white';
        }

        const isToday = i === new Date().getDate();
        const borderClass = isToday ? 'border-2 border-primary-300' : '';

        days.push(
            <div key={i} className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium ${bgClass} ${borderClass}`}>
                {i}
            </div>
        );
    }
    return days;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto no-scrollbar pb-24">
       <div className="px-6 pt-8 pb-4 bg-white shadow-sm z-10 sticky top-0">
         <h2 className="text-xl font-bold text-gray-800">Твой прогресс</h2>
       </div>

       <div className="p-4 space-y-3">
           {/* Stats Overview */}
           <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-2xl shadow-sm">
                    <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Сэкономлено</p>
                    <p className="text-xl font-bold text-primary-600">{totalSaved.toFixed(0)}₽</p>
                </div>
                <div className="bg-white p-3 rounded-2xl shadow-sm">
                    <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Вероятность успеха</p>
                    <p className="text-xl font-bold text-gray-800">
                        {records.length > 0 ? Math.round((successfulDays / records.length) * 100) : 0}%
                    </p>
                </div>
           </div>

           {/* Chart */}
           <div className="bg-white p-4 rounded-3xl shadow-sm">
               <h3 className="font-bold text-gray-800 mb-2 text-sm">Рост накоплений</h3>
               <div className="h-36 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={chartData}>
                           <defs>
                               <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#4CAF50" stopOpacity={0.3}/>
                                   <stop offset="95%" stopColor="#4CAF50" stopOpacity={0}/>
                               </linearGradient>
                           </defs>
                           <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} formatter={(value: number) => [`${Math.round(value)}₽`, 'Сэкономлено']} />
                           <Area type="monotone" dataKey="amount" stroke="#4CAF50" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
                       </AreaChart>
                   </ResponsiveContainer>
               </div>
           </div>

           {/* Achieved Goals Section */}
           <div className="bg-white rounded-3xl p-4 shadow-sm">
               <h3 className="font-bold text-gray-800 mb-3 text-sm">🏆 Достигнутые цели</h3>
               {achievedGoals.length === 0 ? (
                   <p className="text-gray-400 text-xs text-center py-2">Пока нет достигнутых целей. Продолжай копить!</p>
               ) : (
                   <div className="space-y-2">
                       {achievedGoals.map(ag => (
                           <div key={ag.id} className="flex items-center space-x-3 p-3 bg-primary-50 rounded-2xl">
                               <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1">
                                   <img src={ag.imagePath} className="w-full h-full object-contain" alt={ag.name} />
                               </div>
                               <div className="flex-1 min-w-0">
                                   <p className="font-bold text-sm text-gray-900 truncate">{ag.name}</p>
                                   <p className="text-xs text-gray-500">{Math.round(ag.amountSaved)}₽ за {ag.daysToAchieve} дн.</p>
                               </div>
                               <span className="text-xl">✅</span>
                           </div>
                       ))}
                   </div>
               )}
           </div>

           {/* Calendar */}
           <div className="bg-white p-4 rounded-3xl shadow-sm">
               <div className="flex justify-between items-center mb-2">
                   <h3 className="font-bold text-gray-800 text-sm">Этот месяц</h3>
                   <span className="text-xs text-gray-400 capitalize">{new Date().toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}</span>
               </div>
               
               <div className="grid grid-cols-7 gap-1 mb-1">
                   {['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => (
                       <div key={d} className="text-center text-[10px] font-bold text-gray-300">{d}</div>
                   ))}
               </div>
               <div className="grid grid-cols-7 gap-1">
                   {renderCalendar()}
               </div>
               <div className="flex justify-center space-x-4 mt-3 text-[10px] text-gray-500">
                   <div className="flex items-center"><div className="w-2 h-2 bg-primary-500 rounded-full mr-1"></div> Успех</div>
                   <div className="flex items-center"><div className="w-2 h-2 bg-error rounded-full mr-1"></div> Срыв</div>
               </div>
           </div>
       </div>
    </div>
  );
};

export default History;
