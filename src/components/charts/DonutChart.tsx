import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { tooltipProps } from './chartTheme';

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface Props {
  data: DonutSlice[];
  formatValue?: (value: number) => string;
  // Підпис у центрі кільця (напр. загальна сума) і рядок під ним.
  centerValue?: string;
  centerLabel?: string;
}

// Кільцева діаграма частки цілого + легенда з назвою, значенням і %.
// Легенда завжди видима — колір не єдиний носій інформації, а значення
// читаються без наведення (важливо для блідих кольорів на світлому тлі).
const DonutChart = ({ data, formatValue = v => String(v), centerValue, centerLabel }: Props) => {
  const slices = data.filter(d => d.value > 0);
  const total = slices.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative shrink-0" style={{ width: 168, height: 168 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={slices} dataKey="value" nameKey="name"
              innerRadius={54} outerRadius={80} paddingAngle={slices.length > 1 ? 2 : 0}
              stroke="rgb(var(--color-surface))" strokeWidth={2}
              startAngle={90} endAngle={-270} isAnimationActive={false}
            >
              {slices.map(d => <Cell key={d.name} fill={d.color} />)}
            </Pie>
            <Tooltip {...tooltipProps} formatter={(v) => formatValue(Number(v))} />
          </PieChart>
        </ResponsiveContainer>
        {centerValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-6">
            <span className="text-base font-bold text-ink leading-tight">{centerValue}</span>
            {centerLabel && <span className="text-[11px] text-ink-muted leading-tight mt-0.5">{centerLabel}</span>}
          </div>
        )}
      </div>
      <ul className="w-full min-w-0 space-y-2">
        {data.map(d => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-ink-secondary truncate flex-1 min-w-0">{d.name}</span>
            <span className="text-ink font-medium tabular-nums whitespace-nowrap">{formatValue(d.value)}</span>
            <span className="text-ink-muted tabular-nums w-10 text-right">
              {total > 0 ? `${Math.round((d.value / total) * 100)}%` : '—'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DonutChart;
