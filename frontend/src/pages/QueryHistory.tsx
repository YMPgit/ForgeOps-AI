import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trash2, Clock, ChevronRight, MessageSquare, PlayCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useHistory } from '@/hooks/useQuery';
import { useDeleteHistoryItem, useDeleteHistorySession, useClearHistory } from '@/hooks/useQuery';
import type { HistoryItem } from '@/types';

interface Conversation {
  key: string;
  sessionId: string | null;
  title: string;
  items: HistoryItem[];
  lastActive: number;
}

function toConversations(items: HistoryItem[]): Conversation[] {
  const groups = new Map<string, HistoryItem[]>();
  for (const item of items) {
    const key = item.session_id || `solo-${item.id}`;
    const existing = groups.get(key) || [];
    existing.push(item);
    groups.set(key, existing);
  }

  return [...groups.entries()].map(([key, groupItems]) => {
    const sorted = [...groupItems].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const firstUser = [...sorted].find((i) => i.session_id) || sorted[sorted.length - 1];
    return {
      key,
      sessionId: sorted[0].session_id || null,
      title: firstUser.question,
      items: sorted,
      lastActive: new Date(sorted[0].timestamp).getTime(),
    };
  }).sort((a, b) => b.lastActive - a.lastActive);
}

const timeAgo = (ts: number): string => {
  const diff = Date.now() - ts;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
};

export default function QueryHistory() {
  const { data: history = [], isLoading } = useHistory();
  const deleteItemMutation = useDeleteHistoryItem();
  const deleteSessionMutation = useDeleteHistorySession();
  const clearMutation = useClearHistory();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'success' | 'error'>('all');

  const filtered = useMemo(() => {
    return history.filter((item) => {
      const matchesSearch = item.question.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'all' || item.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [history, search, filter]);

  const conversations = useMemo(() => toConversations(filtered), [filtered]);
  const totalQueries = history.length;

  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear all chats?')) return;
    await clearMutation.mutateAsync();
  };

  const handleOpen = (conv: Conversation) => {
    if (conv.sessionId) {
      navigate(`/ask-data?session=${encodeURIComponent(conv.sessionId)}`);
    } else {
      navigate('/ask-data', { state: { question: conv.title } });
    }
  };

  const handleDelete = async (conv: Conversation) => {
    if (!confirm('Delete this chat?')) return;
    if (conv.sessionId) {
      await deleteSessionMutation.mutateAsync(conv.sessionId);
    } else {
      await deleteItemMutation.mutateAsync(conv.items[0].id);
    }
  };

  const successCount = (conv: Conversation) => conv.items.filter((i) => i.status === 'success').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Previous Chats</h2>
          <p className="text-sm text-muted-foreground">Review and reopen your past conversations</p>
        </div>
        {totalQueries > 0 && (
          <Button variant="destructive" size="sm" onClick={handleClear} disabled={clearMutation.isPending}>
            <Trash2 className="mr-1.5 h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Chats</CardTitle>
              <CardDescription>
                {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'} · {totalQueries}{' '}
                {totalQueries === 1 ? 'query' : 'queries'} total
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search chats..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64 pl-9"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'success' | 'error')}
                className="h-9 rounded-md border bg-transparent px-3 text-sm"
              >
                <option value="all">All</option>
                <option value="success">Success</option>
                <option value="error">Errors</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-12 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No chats yet. Start a conversation in Ask Data.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.key}
                  className="group flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent/30"
                  onClick={() => handleOpen(conv)}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{conv.title || 'New chat'}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {timeAgo(conv.lastActive)}
                        <span className="mx-1">•</span>
                        {conv.items.length} {conv.items.length === 1 ? 'message' : 'messages'}
                        <span className="mx-1">•</span>
                        {successCount(conv)}/{conv.items.length} succeeded
                        {conv.items.some((i) => i.status === 'error') && (
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDelete(conv);
                      }}
                      title="Delete chat"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}