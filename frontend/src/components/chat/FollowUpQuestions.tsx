import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FollowUpQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
  loading?: boolean;
}

export default function FollowUpQuestions({ questions, onSelect, loading }: FollowUpQuestionsProps) {
  if (!questions?.length || loading) return null;

  return (
    <div className="mt-4 animate-fade-in">
      <h4 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
        <MessageSquare className="h-4 w-4" />
        Follow-up questions
      </h4>
      <div className="flex flex-wrap gap-2">
        {questions.map((q, i) => (
          <Button
            key={i}
            variant="outline"
            size="sm"
            className="rounded-full text-xs"
            onClick={() => onSelect(q)}
          >
            {q}
          </Button>
        ))}
      </div>
    </div>
  );
}
