'use client';

interface Props {
  percent: number; // 0–100
  size?: number;
  stroke?: number;
}

export default function CircularProgress({ percent, size = 220, stroke = 22 }: Props) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(percent, 100) / 100) * circ;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label={`${percent}% da meta de leitura`}>
      {/* Track */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--brand-light)"
        strokeWidth={stroke}
      />
      {/* Progress */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="var(--brand)"
        strokeWidth={stroke}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transformOrigin: 'center', transform: 'rotate(-90deg)', transition: 'stroke-dashoffset 0.6s ease' }}
      />
      {/* Label */}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 32, fill: 'var(--brand)' }}
      >
        {Math.round(percent)}%
      </text>
    </svg>
  );
}