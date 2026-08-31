import { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Paperclip, Loader2 as Spin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  onSend: (message: string) => void;
  loading: boolean;
  placeholder?: string;
  initialValue?: string;
  onAttach?: (file: File) => void;
  uploadPending?: boolean;
  accept?: string;
}

export default function ChatInput({
  onSend,
  loading,
  placeholder = 'Ask anything about your data...',
  initialValue,
  onAttach,
  uploadPending = false,
  accept = '.csv,.xlsx,.xls,.json,.db,.sqlite,.sqlite3',
}: ChatInputProps) {
  const [value, setValue] = useState(initialValue || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleSubmit = () => {
    if (!value.trim() || loading || uploadPending) return;
    onSend(value.trim());
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAttach) {
      onAttach(file);
    }
    e.target.value = '';
  };

  return (
    <div className="border-t bg-background/95 p-4 backdrop-blur">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-xl border bg-card p-2 shadow-sm">
          {onAttach && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mb-0.5 h-9 w-9 shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || uploadPending}
              title="Attach a data file (CSV, Excel, JSON, SQLite)"
            >
              {uploadPending ? <Spin className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={accept}
            onChange={handleFileChange}
          />
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="max-h-40 min-h-[40px] resize-none border-0 bg-transparent px-2 py-2 focus-visible:ring-0"
            disabled={loading}
          />
          <Button
            onClick={handleSubmit}
            disabled={!value.trim() || loading || uploadPending}
            size="icon"
            className="mb-0.5 h-9 w-9 shrink-0"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Press <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">Enter</kbd> to send,{' '}
          <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">Shift + Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}