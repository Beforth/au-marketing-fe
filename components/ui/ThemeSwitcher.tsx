
import React, { useState } from 'react';
import { useTheme, THEMES, ThemeColor } from '../../context/ThemeContext';
import { Palette, Check } from 'lucide-react';

export const ThemeSwitcher: React.FC = () => {
  const { color: activeColor, setColor } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-2 group outline-none"
        title="Change Theme"
      >
        <Palette size={20} strokeWidth={2} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-4 w-56 bg-white border border-slate-200 shadow-xl z-50 p-2 rounded-2xl animate-in fade-in zoom-in-95 duration-200">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-3 py-2 border-b border-slate-100 mb-1">Theme Palette</p>
            <div className="grid grid-cols-1 gap-1">
              {(Object.keys(THEMES) as ThemeColor[]).map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    setColor(key);
                    setIsOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-medium transition-all ${activeColor === key ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3.5 h-3.5 rounded-full border border-white/20"
                      style={{ backgroundColor: THEMES[key].primary }}
                    />
                    <span>{THEMES[key].name}</span>
                  </div>
                  {activeColor === key && <Check size={14} className="text-white" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
