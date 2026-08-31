import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Database, Clock, TrendingUp, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useHistory } from '@/hooks/useQuery';
import { useDatasourceInfo } from '@/hooks/useQuery';
import type { HistoryItem } from '@/types';

const exampleQuestions = [
  'What are the top 5 products by revenue?',
  'Show me monthly sales trends for 2024',
  'Which products have the highest profit margins?',
  'Compare this year vs last year performance',
];

export default function Dashboard() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { data: history = [], isLoading: historyLoading } = useHistory();
  const { data: datasource, isLoading: dsLoading } = useDatasourceInfo();

  const recentQuestions = history.slice(0, 5);

  const goAsk = (q: string) => {
    navigate('/ask-data', q.trim() ? { state: { question: q.trim() } } : undefined);
  };

  const handleExampleClick = (q: string) => {
    setQuery(q);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      goAsk(query);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Ask questions. Get answers from your data.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Connect your database, ask in plain English, and get instant SQL-powered insights.
        </p>
        <div className="mx-auto mt-6 max-w-2xl">
          <div className="flex items-center gap-2 rounded-xl border bg-card p-2 shadow-sm">
            <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your data..."
              className="flex-1 bg-transparent py-2.5 text-sm outline-none"
            />
            <button
              onClick={() => goAsk(query)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Ask
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {exampleQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleExampleClick(q)}
                className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Database Status</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {dsLoading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-muted" />
            ) : (
              <>
                <div className="text-2xl font-bold">{datasource ? 'Connected' : 'Disconnected'}</div>
                <p className="text-xs text-muted-foreground">{datasource?.name || 'No database'}</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {dsLoading ? (
              <div className="h-8 w-12 animate-pulse rounded bg-muted" />
            ) : (
              <div className="text-2xl font-bold">{datasource?.tables || 0}</div>
            )}
            <p className="text-xs text-muted-foreground">Available in schema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recent Queries</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{history.length}</div>
            <p className="text-xs text-muted-foreground">Total queries run</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Questions
          </CardTitle>
          <CardDescription>Your latest queries and their results</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : recentQuestions.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No queries yet. Start by asking a question above!
            </div>
          ) : (
            <div className="space-y-2">
              {recentQuestions.map((item: HistoryItem) => (
                <button
                  key={item.id}
                  onClick={() => goAsk(item.question)}
                  className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-accent/30 cursor-pointer"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.question}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.timestamp).toLocaleString()} • {item.execution_time}s
                    </p>
                  </div>
                  <span className={`text-xs ${item.status === 'success' ? 'text-green-500' : 'text-destructive'}`}>
                    {item.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
