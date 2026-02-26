import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useWizardState } from '../hooks/use-wizard-state';
import { useAuth } from '../hooks/use-auth';
import { useJobPolling } from '../hooks/use-job-polling';
import WizardLayout from '../components/layout/WizardLayout';
import { analyzeDrawing } from '../api';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import { DrawingAnalysis } from '../types';

export default function RecognizePage() {
  const { state, setAnalysis, setRunId } = useWizardState();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analyzing, setAnalyzing] = useState(true);
  const [formData, setFormData] = useState({
    subject: '',
    setting: '',
    mood: '',
  });
  const [colors, setColors] = useState<string[]>([]);
  const [details, setDetails] = useState<string[]>([]);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [runId, setLocalRunId] = useState<string | null>(null);
  const hasAnalyzed = useRef(false);

  // Polling hook for async vision analysis
  const handlePollComplete = useCallback((data: { drawing_analysis: Record<string, unknown> | null }) => {
    if (data.drawing_analysis) {
      const analysis = data.drawing_analysis as unknown as DrawingAnalysis;
      setFormData({
        subject: analysis.subject,
        setting: analysis.setting,
        mood: analysis.mood,
      });
      setColors(analysis.colors);
      setDetails(analysis.details);
      setAnalyzing(false);
    }
  }, []);

  const handlePollError = useCallback((err: string) => {
    toast.error(err || 'Failed to analyze drawing');
    setAnalyzing(false);
  }, []);

  const { status, isPolling, startPolling } = useJobPolling(runId, user?.userId ?? null, {
    onComplete: handlePollComplete,
    onError: handlePollError,
  });

  useEffect(() => {
    document.title = 'NoComelon | Recognize';
    if (!state.drawing) {
      navigate('/upload', { replace: true });
      return;
    }

    const url = URL.createObjectURL(state.drawing);
    setObjectUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [state.drawing, navigate]);

  useEffect(() => {
    if (!state.drawing || hasAnalyzed.current || !user?.userId) return;
    hasAnalyzed.current = true;

    async function analyze() {
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64 = (reader.result as string).split(',')[1];
            // API now returns immediately with run_id
            const response = await analyzeDrawing(base64, user!.userId);
            setLocalRunId(response.run_id);
            setRunId(response.run_id);
            // Start polling for results
            startPolling();
          } catch (error) {
            toast.error('Failed to analyze drawing');
            setAnalyzing(false);
          }
        };
        reader.readAsDataURL(state.drawing);
      } catch (error) {
        toast.error('Failed to read drawing');
        setAnalyzing(false);
      }
    }

    analyze();
  }, [state.drawing, user?.userId, setRunId, startPolling]);

  const handleAction = () => {
    setAnalysis({
      subject: formData.subject,
      setting: formData.setting,
      mood: formData.mood,
      details: details,
      colors: colors,
    });
    navigate('/customize');
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!state.drawing) return null;

  return (
    <WizardLayout
      currentStep={2}
      actionLabel="Looks Good!"
      actionDisabled={analyzing}
      onAction={handleAction}
      showProgress={true}
    >
      <div className="flex justify-center mt-4 mb-6">
        <div className="w-[100px] h-[100px] rounded-xl overflow-hidden border-2 border-primary/20 shadow-sm bg-muted">
          {objectUrl ? (
            <img src={objectUrl} alt="Your drawing" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
        </div>
      </div>

      <div className="text-lg font-semibold mb-3">We see...</div>

      {analyzing ? (
        <div className="bg-card rounded-xl border p-4 space-y-4">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-20 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-6 w-full rounded-full" />
          {isPolling && status?.current_stage && (
            <p className="text-sm text-muted-foreground text-center">
              {status.current_stage === 'vision' ? 'Analyzing your drawing...' : 'Processing...'}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-4 space-y-4 animate-in fade-in duration-300">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="setting">Setting</Label>
            <Textarea
              rows={2}
              id="setting"
              value={formData.setting}
              onChange={(e) => handleInputChange('setting', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mood">Mood</Label>
            <Input
              id="mood"
              value={formData.mood}
              onChange={(e) => handleInputChange('mood', e.target.value)}
            />
          </div>

          {details.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Details</div>
              <div className="flex flex-wrap gap-2">
                {details.map((detail, index) => (
                  <span key={index} className="px-3 py-1 rounded-full text-sm font-medium border bg-card">
                    {detail}
                  </span>
                ))}
              </div>
            </div>
          )}

          {colors.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Colors</div>
              <div className="flex flex-wrap gap-2">
                {colors.map((color, index) => (
                  <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border bg-card">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="capitalize">{color}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </WizardLayout>
  );
}
