import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PieChartProps {
  data: Record<string, unknown>[];
  xAxis: string;
  yAxis: string;
  className?: string;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--primary) / 0.8)',
  'hsl(var(--primary) / 0.6)',
  'hsl(var(--primary) / 0.4)',
  'hsl(var(--primary) / 0.2)',
  'hsl(var(--secondary))',
];

export default function PieChart({ data, xAxis, yAxis, className }: PieChartProps) {
  const chartData = useMemo(() => {
    return data.map((row) => ({
      name: String(row[xAxis] ?? ''),
      value: Number(row[yAxis] ?? 0),
    }));
  }, [data, xAxis, yAxis]);

  if (!data.length) return null;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RechartsPieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          outerRadius={120}
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}
        />
        <Legend />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}
