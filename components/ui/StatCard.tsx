
import React from 'react';
import { StatItem } from '../../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export const StatCard: React.FC<{ stat: StatItem }> = ({ stat }) => {
  const isUp = stat.trend === 'up';
  const isDown = stat.trend === 'down';

  return (
    <div
      className="bg-white border border-slate-200/60 transition-all duration-300 group cursor-default shadow-[0_2px_4px_rgba(0,0,0,0.02),0_1px_0_rgba(0,0,0,0.02)] hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200/50 flex flex-col justify-between p-6"
      style={{ borderRadius: '1rem' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="w-9 h-9 bg-slate-50 border border-slate-100 rounded-lg text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 group-hover:border-indigo-100 flex items-center justify-center transition-all">
          <stat.icon size={18} strokeWidth={2} />
        </div>
        <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isUp ? 'text-emerald-600 bg-emerald-50' :
          isDown ? 'text-rose-600 bg-rose-50' :
            'text-slate-500 bg-slate-100'
          }`}>
          {isUp && <TrendingUp size={10} strokeWidth={3} />}
          {isDown && <TrendingDown size={10} strokeWidth={3} />}
          {!isUp && !isDown && <Minus size={10} strokeWidth={3} />}
          {stat.change.split(' ')[0]}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">{stat.value}</h3>
        <p className="text-[10px] text-slate-400 mt-1 font-medium">
          {stat.change.replace(stat.change.split(' ')[0], '').trim()}
        </p>
      </div>
    </div>
  );
};
