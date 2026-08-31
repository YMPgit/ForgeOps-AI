import { useState, useEffect } from 'react';
import { Save, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { useSettings, useUpdateSettings } from '@/hooks/useQuery';
import { loadAppSettings, saveAppSettings, applyTheme, type AppSettings } from '@/lib/appSettings';

const DEFAULT_MODELS = [
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b',
  'qwen/qwen3.8-27b',
];

export default function Settings() {
  const { toast } = useToast();
  const { data: backendSettings } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  const [model, setModel] = useState('openai/gpt-oss-120b');

  const [appSettings, setAppSettings] = useState<AppSettings>(() => loadAppSettings());

  useEffect(() => {
    if (backendSettings?.model) {
      setModel(backendSettings.model);
    }
  }, [backendSettings]);

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setAppSettings((prev) => ({ ...prev, [key]: value }));
    if (key === 'theme') {
      applyTheme(value as AppSettings['theme']);
    }
  };

  const handleSave = async () => {
    try {
      saveAppSettings(appSettings);
      applyTheme(appSettings.theme);

      await updateSettingsMutation.mutateAsync({
        model,
      });

      toast({
        title: 'Settings saved successfully',
        description: 'Your AI model and application preferences have been updated.',
      });
    } catch (err: any) {
      toast({
        title: 'Failed to update settings',
        description: err?.message || 'Could not update settings.',
        variant: 'destructive',
      });
    }
  };

  const availableModels = backendSettings?.available_models?.length
    ? backendSettings.available_models
    : DEFAULT_MODELS;

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in pb-12">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your AI model configuration and application preferences
        </p>
      </div>

      {/* AI Model & Inference Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Model Configuration
          </CardTitle>
          <CardDescription>Configure which Groq LLM model handles SQL generation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="model-select">Model</Label>
            <select
              id="model-select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m} {m === 'openai/gpt-oss-120b' ? '(Recommended)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Temperature: {appSettings.temperature.toFixed(2)}</Label>
              <span className="text-xs text-muted-foreground">Default: 0.10</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={appSettings.temperature}
              onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))}
              className="w-full cursor-pointer accent-primary"
            />
            <p className="text-xs text-muted-foreground">
              Lower values ensure precise and deterministic SQL generation. Applies to the next query.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-tokens">Max Tokens</Label>
            <Input
              id="max-tokens"
              type="number"
              value={appSettings.maxTokens}
              onChange={(e) =>
                updateSetting('maxTokens', parseInt(e.target.value) || 1024)
              }
            />
            <p className="text-xs text-muted-foreground">
              Maximum output tokens per AI generation. Applies to the next query.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Application Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Application Preferences</CardTitle>
          <CardDescription>Default display options for data analysis and charts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="chart-type">Default Chart Type</Label>
            <select
              id="chart-type"
              value={appSettings.defaultChartType}
              onChange={(e) => updateSetting('defaultChartType', e.target.value as AppSettings['defaultChartType'])}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="auto">Auto (AI Recommended)</option>
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="table">Table Only</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="theme-select">Theme</Label>
            <select
              id="theme-select"
              value={appSettings.theme}
              onChange={(e) => updateSetting('theme', e.target.value as AppSettings['theme'])}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateSettingsMutation.isPending}
          className="gap-2 px-6"
        >
          <Save className="h-4 w-4" />
          {updateSettingsMutation.isPending ? 'Saving & Verifying...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}

