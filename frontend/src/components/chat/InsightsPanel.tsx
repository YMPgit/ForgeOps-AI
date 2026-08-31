import { Lightbulb, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { Insights } from '@/types';

interface InsightsPanelProps {
  insights: Insights;
  rowCount?: number;
}

export default function InsightsPanel({ insights, rowCount }: InsightsPanelProps) {
  if (!insights) return null;

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm leading-relaxed text-muted-foreground">{insights.summary}</p>
        </div>
        {insights.key_findings?.length > 0 && (
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Key Findings
            </h4>
            <ul className="space-y-1">
              {insights.key_findings.map((finding, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-green-500" />
                  {finding}
                </li>
              ))}
            </ul>
          </div>
        )}
        {insights.recommendations?.length > 0 && (
          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Recommendations
            </h4>
            <ul className="space-y-1">
              {insights.recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-orange-500" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Separator className="my-2" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Row count: {rowCount || 0}</span>
          <span>Status: <span className="text-green-500">Success</span></span>
        </div>
      </CardContent>
    </Card>
  );
}
