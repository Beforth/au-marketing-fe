import React from 'react';

interface KpiSparklineProps {
  data: number[];
  /** Inline styles only — this is a tiny SVG, not an apex chart. */
  stroke?: string;
  width?: number;
  height?: number;
  fill?: boolean;
}

const noopPoints = (width: number, height: number) => `0,${height / 2} ${width},${height / 2}`;

export const KpiSparkline: React.FC<KpiSparklineProps> = ({
  data,
  stroke = '#2563eb',
  width = 72,
  height = 24,
  fill = false,
}) => {
  const values = (data || []).filter((v) => typeof v === 'number' && !isNaN(v));
  if (values.length < 2) {
    const flat = noopPoints(width, height);
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0" aria-hidden>
        <polyline points={flat} fill="none" stroke="#e2e8f0" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - 2 - ((v - min) / range) * (height - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0" aria-hidden>
      {fill && (
        <>
          <defs>
            <linearGradient id={`spark-fill-${stroke.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.22} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <polygon points={`0,${height} ${points} ${width},${height}`} fill={`url(#spark-fill-${stroke.replace('#', '')})`} />
        </>
      )}
      <polyline points={points} fill="none" stroke={stroke} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={height - 2 - ((values[values.length - 1] - min) / range) * (height - 6)} r={2} fill={stroke} />
    </svg>
  );
};
