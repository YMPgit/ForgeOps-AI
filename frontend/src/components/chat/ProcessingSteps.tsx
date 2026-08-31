import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, HelpCircle, Code, ShieldCheck, Play, BarChart3, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProcessingStep } from '@/types';

const STEPS_CONFIG = [
  { id: 'understanding', label: 'Understanding your question...', icon: HelpCircle },
  { id: 'generating', label: 'Generating SQL...', icon: Code },
  { id: 'validating', label: 'Validating query...', icon: ShieldCheck },
  { id: 'running', label: 'Running query...', icon: Play },
  { id: 'analyzing', label: 'Analyzing results...', icon: BarChart3 },
  { id: 'insights', label: 'Generating insights...', icon: Sparkles },
];

interface ProcessingStepsProps {
  steps: ProcessingStep[];
}

export default function ProcessingSteps({ steps }: ProcessingStepsProps) {
  const [visibleSteps, setVisibleSteps] = useState<string[]>([]);

  useEffect(() => {
    const active = steps.filter((s) => s.status === 'active' || s.status === 'completed').map((s) => s.id);
    setVisibleSteps(active);
  }, [steps]);

  const getStatus = (stepId: string) => {
    const step = steps.find((s) => s.id === stepId);
    if (!step) return 'pending';
    return step.status;
  };

  return (
    <div className="mt-4 rounded-lg border bg-card/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm font-medium">Processing your request</span>
      </div>
      <div className="space-y-2.5">
        {STEPS_CONFIG.map((stepConfig) => {
          const status = getStatus(stepConfig.id);
          const isVisible = visibleSteps.includes(stepConfig.id);
          if (!isVisible) return null;

          const Icon = stepConfig.icon;
          return (
            <div key={stepConfig.id} className={cn('flex items-center gap-3 text-sm transition-all', status === 'active' && 'text-primary')}>
              {status === 'completed' ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : status === 'error' ? (
                <XCircle className="h-4 w-4 text-destructive" />
              ) : (
                <Icon className="h-4 w-4 animate-pulse text-muted-foreground" />
              )}
              <span className={cn(status === 'pending' && 'text-muted-foreground')}>{stepConfig.label}</span>
              {status === 'active' && (
                <div className="ml-auto">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
