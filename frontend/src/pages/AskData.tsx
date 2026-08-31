import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Database, X, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatInput from '@/components/chat/ChatInput';
import MessageBubble from '@/components/chat/MessageBubble';
import SQLBlock from '@/components/chat/SQLBlock';
import ChartView from '@/components/chat/ChartView';
import InsightsPanel from '@/components/chat/InsightsPanel';
import FollowUpQuestions from '@/components/chat/FollowUpQuestions';
import ProcessingSteps from '@/components/chat/ProcessingSteps';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useHistory, useUploadDatasource, useResetDatasource, useDatasourceInfo } from '@/hooks/useQuery';
import { loadAppSettings } from '@/lib/appSettings';
import { scopeKey } from '@/lib/userScope';
import { getToken } from '@/services/api';
import type { Message as MessageType, ProcessingStep, QueryResponse, ChartRecommendation, Insights } from '@/types';

const DEFAULT_SUGGESTIONS = [
  'What are the top 10 products by sales?',
  'Show me revenue trends over the past year',
  'Which regions have the highest customer count?',
];

const CHATS_KEY = () => scopeKey('talk-to-data-chats');
const MAX_STORED_CHATS = 20;
const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.json', '.db', '.sqlite', '.sqlite3'];

type StoredMessage = Omit<MessageType, 'timestamp' | 'processingSteps'> & { timestamp: string };

interface StoredChat {
  session_id: string;
  title: string;
  updated_at: number;
  messages: StoredMessage[];
}

function loadChats(): StoredChat[] {
  try {
    const raw = localStorage.getItem(CHATS_KEY());
    return raw ? (JSON.parse(raw) as StoredChat[]) : [];
  } catch {
    return [];
  }
}

function serializeMessages(msgs: MessageType[]): StoredMessage[] {
  return msgs.map((m) => {
    const copy: Record<string, unknown> = { ...m };
    delete copy.processingSteps;
    copy.timestamp = (m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp)).toISOString();
    return copy as unknown as StoredMessage;
  });
}

function deserializeMessages(msgs: StoredMessage[]): MessageType[] {
  return msgs.map(({ timestamp, ...rest }) => ({ ...rest, timestamp: new Date(timestamp) }));
}

function persistChat(chat: StoredChat | null) {
  if (!chat || chat.messages.length === 0) return;
  const existing = loadChats().filter((c) => c.session_id !== chat.session_id);
  existing.unshift(chat);
  while (existing.length > MAX_STORED_CHATS) existing.pop();
  localStorage.setItem(CHATS_KEY(), JSON.stringify(existing));
}

const createProcessingSteps = (): ProcessingStep[] => [
  { id: 'understanding', label: 'Understanding your question...', status: 'active' },
  { id: 'generating', label: 'Generating SQL...', status: 'pending' },
  { id: 'validating', label: 'Validating query...', status: 'pending' },
  { id: 'running', label: 'Running query...', status: 'pending' },
  { id: 'analyzing', label: 'Analyzing results...', status: 'pending' },
  { id: 'insights', label: 'Generating insights...', status: 'pending' },
];

export default function AskData() {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [uploadError, setUploadError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const autoSentRef = useRef(false);

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuestion = (location.state as { question?: string } | null)?.question || '';
  const sessionParam = searchParams.get('session');

  const { data: history = [] } = useHistory();
  const { data: datasource } = useDatasourceInfo();
  const uploadMutation = useUploadDatasource();
  const resetMutation = useResetDatasource();

  const suggestions = useMemo(() => {
    const fromHistory = history
      .filter((h) => h.status === 'success' && h.question)
      .slice(0, 3)
      .map((h) => h.question);
    return [...new Set([...fromHistory, ...DEFAULT_SUGGESTIONS])].slice(0, 4);
  }, [history]);

  const isCustomDatasource =
    !!datasource && datasource.name.toLowerCase() !== 'demo database (sqlite)';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (autoSentRef.current) return;
    autoSentRef.current = true;

    if (sessionParam) {
      const chat = loadChats().find((c) => c.session_id === sessionParam);
      setSessionId(sessionParam);
      if (chat) {
        setMessages(deserializeMessages(chat.messages));
      }
    }

    if (initialQuestion) {
      void handleSend(initialQuestion, { session: sessionParam || undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sessionId || messages.length === 0) return;
    const title = messages.find((m) => m.type === 'user')?.content || 'New chat';
    persistChat({
      session_id: sessionId,
      title,
      updated_at: Date.now(),
      messages: serializeMessages(messages),
    });
  }, [messages, sessionId]);

  const updateStepStatus = (steps: ProcessingStep[], activeId: string): ProcessingStep[] => {
    const index = steps.findIndex((s) => s.id === activeId);
    return steps.map((s, i) => ({
      ...s,
      status: i < index ? 'completed' : i === index ? 'active' : 'pending',
    }));
  };

  const handleSend = async (question: string, opts?: { session?: string }) => {
    if (loading) return;

    const settings = loadAppSettings();
    const sid = opts?.session || sessionId || crypto.randomUUID();
    if (!sessionId) setSessionId(sid);

    const userMessage: MessageType = {
      id: crypto.randomUUID(),
      type: 'user',
      content: question,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    const initialSteps = createProcessingSteps();
    setProcessingSteps(initialSteps);

    abortControllerRef.current = new AbortController();

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      setProcessingSteps((prev) => updateStepStatus(prev, 'generating'));
      await new Promise((resolve) => setTimeout(resolve, 800));
      setProcessingSteps((prev) => updateStepStatus(prev, 'validating'));
      await new Promise((resolve) => setTimeout(resolve, 500));
      setProcessingSteps((prev) => updateStepStatus(prev, 'running'));

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: JSON.stringify({
          question,
          temperature: settings.temperature,
          max_tokens: settings.maxTokens,
          session_id: sid,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Query failed' }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }

      const data: QueryResponse = await res.json();

      setProcessingSteps((prev) => updateStepStatus(prev, 'analyzing'));
      await new Promise((resolve) => setTimeout(resolve, 600));
      setProcessingSteps((prev) => updateStepStatus(prev, 'insights'));
      await new Promise((resolve) => setTimeout(resolve, 400));

      const aiMessage: MessageType = {
        id: crypto.randomUUID(),
        type: 'ai',
        content: 'Here are the results for your query:',
        timestamp: new Date(),
        sql: data.sql,
        results: data.rows,
        columns: data.columns,
        chart: data.chart_recommendation ?? undefined,
        insights: data.insights,
        followUpQuestions: data.follow_up_questions,
        rowCount: data.row_count,
      };

      setMessages((prev) => [...prev, aiMessage]);
      setProcessingSteps((prev) =>
        prev.map((s) => ({ ...s, status: s.id === 'insights' ? 'completed' : s.status }))
      );
    } catch (error) {
      const err = error as Error;
      if (err.name !== 'AbortError') {
        const aiMessage: MessageType = {
          id: crypto.randomUUID(),
          type: 'ai',
          content: `Error: ${err.message}`,
          timestamp: new Date(),
          error: err.message,
        };
        setMessages((prev) => [...prev, aiMessage]);
        setProcessingSteps((prev) =>
          prev.map((s) => ({ ...s, status: s.id === 'running' ? 'error' : s.status }))
        );
      }
    } finally {
      setLoading(false);
      setProcessingSteps([]);
    }
  };

  const handleFollowUp = (q: string) => {
    void handleSend(q);
  };

  const handleNewChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setMessages([]);
    setProcessingSteps([]);
    setLoading(false);
    setSessionId(null);
    setUploadError('');
    navigate('/ask-data', { replace: true });
  };

  const handleAttach = async (file: File) => {
    setUploadError('');
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setUploadError('Unsupported file type. Use CSV, Excel, JSON, or SQLite (.db/.sqlite/.sqlite3).');
      return;
    }
    try {
      await uploadMutation.mutateAsync(file);
    } catch (e) {
      setUploadError((e as Error).message || 'Upload failed');
    }
  };

  const handleResetData = async () => {
    setUploadError('');
    await resetMutation.mutateAsync();
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Chat with your data</h2>
        {(messages.length > 0 || sessionId) && (
          <Button variant="ghost" size="sm" onClick={handleNewChat} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New chat
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 rounded-lg border bg-card/50" ref={scrollRef}>
        <div className="mx-auto max-w-3xl space-y-6 p-4">
          {messages.length === 0 && !loading && (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <span className="text-xl">💬</span>
              </div>
              <h3 className="text-lg font-medium">Start a conversation</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Attach a data file (CSV, Excel, JSON, SQLite) or ask a question about your data
              </p>
              <div className="mx-auto mt-6 flex max-w-lg flex-wrap justify-center gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => void handleSend(s)}
                    className="rounded-xl border px-3 py-2 text-xs transition-colors hover:border-primary hover:text-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id}>
              <MessageBubble message={msg} />
              {msg.type === 'ai' && msg.sql && <SQLBlock sql={msg.sql} />}
              {msg.type === 'ai' && msg.results?.length ? <ChartView message={msg} /> : null}
              {msg.type === 'ai' && msg.insights && !msg.error && <InsightsPanel insights={msg.insights} rowCount={msg.rowCount} />}
              {msg.type === 'ai' && msg.followUpQuestions?.length ? (
                <FollowUpQuestions questions={msg.followUpQuestions} onSelect={handleFollowUp} />
              ) : null}
            </div>
          ))}

          {loading && processingSteps.length > 0 && <ProcessingSteps steps={processingSteps} />}
        </div>
      </ScrollArea>

      <div className="mx-auto w-full max-w-3xl">
        {isCustomDatasource && datasource && (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border bg-muted/50 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2 text-sm">
              <Database className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate font-medium">{datasource.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {datasource.tables} {datasource.tables === 1 ? 'table' : 'tables'} ·{' '}
                {datasource.total_rows.toLocaleString()} rows
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleResetData} disabled={resetMutation.isPending}>
                Use demo data
              </Button>
              <X className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-foreground" onClick={handleResetData} />
            </div>
          </div>
        )}
        {uploadError && (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <span className="flex items-center gap-2">
              <FileUp className="h-4 w-4" />
              {uploadError}
            </span>
            <X className="h-4 w-4 cursor-pointer" onClick={() => setUploadError('')} />
          </div>
        )}
      </div>

      <ChatInput onSend={handleSend} loading={loading} initialValue={initialQuestion} onAttach={handleAttach} uploadPending={uploadMutation.isPending} />
    </div>
  );
}