interface ProgressRingProps {
  value: number;
  label?: string;
}

export function ProgressRing({ value, label = 'Plan completion' }: ProgressRingProps) {
  const safeValue = Math.max(0, Math.min(100, value));
  const circumference = 2 * Math.PI * 36;
  return (
    <svg className="progress-ring" viewBox="0 0 92 92" role="img" aria-label={`${label}: ${safeValue}%`}>
      <defs><linearGradient id="progress-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#aa83ff" /><stop offset="54%" stopColor="#729eff" /><stop offset="100%" stopColor="#53deca" /></linearGradient></defs>
      <circle className="progress-ring-track" cx="46" cy="46" r="36" fill="none" strokeWidth="7" />
      <circle className="progress-ring-value" cx="46" cy="46" r="36" fill="none" stroke="url(#progress-gradient)" strokeWidth="7" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - safeValue / 100)} transform="rotate(-90 46 46)" />
      <text x="46" y="44" textAnchor="middle" className="progress-ring-number">{safeValue}%</text>
      <text x="46" y="57" textAnchor="middle" className="progress-ring-caption">DONE</text>
    </svg>
  );
}
