import { useMemo, useState } from 'react';
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, Table2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import BarChart from '@/components/charts/BarChart';
import LineChart from '@/components/charts/LineChart';
import PieChart from '@/components/charts/PieChart';
import ResultTable from '@/components/chat/ResultTable';
import { cn } from '@/lib/utils';
import { loadAppSettings } from '@/lib/appSettings';
import type { ChartRecommendation, Message as MessageType } from '@/types';

interface ChartViewProps {
  message: MessageType;
}

const chartTypes: { value: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'bar', label: 'Bar', icon: BarChart3 },
  { value: 'line', label: 'Line', icon: LineChartIcon },
  { value: 'pie', label: 'Pie', icon: PieChartIcon },
  { value: 'table', label: 'Table', icon: Table2 },
];

export default function ChartView({ message }: ChartViewProps) {
  const columns = message.columns || [];
  const xAxis = message.chart?.x_axis || columns[0] || '';
  const yAxis = message.chart?.y_axis || columns.find((c) => c !== xAxis) || '';

  const numericColumns = useMemo(() => {
    if (!message.results?.length) return [];
    const first = message.results[0];
    return columns.filter((col) => {
      if (col === xAxis) return false;
      const val = first[col];
      return typeof val === 'number' || (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val)));
    });
  }, [message.results, columns, xAxis]);

  const seriesYAxes = numericColumns.length ? numericColumns : [yAxis].filter(Boolean);

  const [activeTab, setActiveTab] = useState<string>(() => {
    const pref = loadAppSettings().defaultChartType;
    if (pref !== 'auto') {
      return chartTypes.some((t) => t.value === pref) ? pref : (message.chart?.type || 'table');
    }
    return message.chart?.type || (seriesYAxes.length ? 'bar' : 'table');
  });

  if (!message.results?.length) return null;

  if (!seriesYAxes.length) {
    return <ResultTable message={message} />;
  }

  const chart = message.chart || { type: activeTab, x_axis: xAxis, y_axis: seriesYAxes[0] };

  return (
    <div className="mt-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
        <div className="flex items-center justify-between">
          <TabsList>
            {chartTypes.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="gap-1.5">
                <Icon className="h-4 w-4" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          <span className="hidden text-xs text-muted-foreground sm:block">
            {xAxis} vs {seriesYAxes.length > 1 ? seriesYAxes.join(', ') : seriesYAxes[0]}
          </span>
        </div>
        <TabsContent value="bar" className="mt-2">
          <div className="rounded-lg border bg-card p-4">
            <BarChart data={message.results} xAxis={xAxis} yAxis={chart.y_axis || seriesYAxes[0]} yAxes={seriesYAxes} />
          </div>
        </TabsContent>
        <TabsContent value="line" className="mt-2">
          <div className="rounded-lg border bg-card p-4">
            <LineChart data={message.results} xAxis={xAxis} yAxis={chart.y_axis || seriesYAxes[0]} yAxes={seriesYAxes} />
          </div>
        </TabsContent>
        <TabsContent value="pie" className="mt-2">
          <div className="rounded-lg border bg-card p-4">
            <PieChart data={message.results} xAxis={xAxis} yAxis={chart.y_axis || seriesYAxes[0]} />
          </div>
        </TabsContent>
        <TabsContent value="table" className="mt-2">
          <ResultTable message={message} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
