import { User, Bot, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message as MessageType } from '@/types';

interface MessageBubbleProps {
  message: MessageType;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.type === 'user';
  const isError = Boolean(message.error || message.content.startsWith('Error:'));

  return (
    <div className={cn('flex gap-3 animate-fade-in', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-primary text-primary-foreground'
            : isError
            ? 'bg-destructive/10 text-destructive'
            : 'bg-muted text-foreground'
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : isError ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3',
          isUser
            ? 'bg-primary text-primary-foreground'
            : isError
            ? 'border border-destructive/20 bg-destructive/5 text-destructive-foreground'
            : 'bg-muted'
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

        <span className="mt-1.5 block text-xs opacity-60">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

