import React from 'react';

interface WonLostDonutProps {
  won: number;
  lost: number;
  /** Center label — defaults to conversion % when total > 0. */
  centerLabel?: string;
  centerSub?: string;
  size?: number;
}

const STATUS_GOOD = '#0ca30c';
const STATUS_CRITICAL = '#d03b3b';

export const WonLostDonut: React.FC<WonLostDonutProps> = ({ won, lost, centerLabel, centerSub, size = 46 }) => {
  const total = won + lost;
  const stroke = 5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const wonFrac = total > 0 ? won / total : 0;
  const lostFrac = total > 0 ? lost / total : 0;
  const rotation = -90;
  const wonLen = wonFrac * c;
  const lostLen = lostFrac * c;

  const label = centerLabel ?? (total > 0 ? `${Math.round(wonFrac * 100)}%` : '—');
  const sub = centerSub ?? (total > 0 ? `${won}/${total} won` : 'no closes');

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} title={`${won} won · ${lost} lost`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        {won > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={STATUS_GOOD}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${wonLen} ${c - wonLen}`}
            strokeDashoffset={(rotation / 360) * c}
          />
        )}
        {lost > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={STATUS_CRITICAL}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${lostLen} ${c - lostLen}`}
            strokeDashoffset={((rotation + wonFrac * 360) / 360) * c}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[10px] font-bold text-slate-800 tabular-nums">{label}</span>
        <span className="text-[6.5px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{sub}</span>
      </div>
    </div>
  );
};
