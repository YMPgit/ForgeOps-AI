import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

const COLORS = [
  'hsl(var(--primary))',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#3b82f6',
  '#8b5cf6',
  '#14b8a6',
];

interface LineChartProps {
  data: Record<string, unknown>[];
  xAxis: string;
  yAxis: string;
  yAxes?: string[];
  className?: string;
}

export default function LineChart({ data, xAxis, yAxis, yAxes, className }: LineChartProps) {
  const series = useMemo(() => (yAxes && yAxes.length ? yAxes : [yAxis]), [yAxes, yAxis]);

  const chartData = useMemo(() => {
    return data.map((row) => {
      const entry: Record<string, unknown> = { name: String(row[xAxis] ?? '') };
      for (const s of series) {
        entry[s] = Number(row[s] ?? 0);
      }
      return entry;
    });
  }, [data, xAxis, series]);

  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsLineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} className="text-muted-foreground" />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}
        />
        <Legend />
        {series.map((s, i) => (
          <Line key={s} type="monotone" dataKey={s} name={s} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
