import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useWizardState } from '../hooks/use-wizard-state';
import { useAuth } from '../hooks/use-auth';
import WizardLayout from '../components/layout/WizardLayout';
import { analyzeDrawing } from '../api';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';

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
  const hasAnalyzed = useRef(false);

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
    if (!state.drawing || hasAnalyzed.current) return;
    hasAnalyzed.current = true;

    async function analyze() {
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64 = (reader.result as string).split(',')[1];
            const response = await analyzeDrawing(base64, user?.userId);
            setRunId(response.run_id);
            setFormData({
              subject: response.drawing.subject,
              setting: response.drawing.setting,
              mood: response.drawing.mood,
            });
            setColors(response.drawing.colors);
            setDetails(response.drawing.details);
            setAnalyzing(false);
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
  }, [state.drawing]);

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

          {colors.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Detected Colors</div>
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
