import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWizardState } from '../hooks/use-wizard-state.tsx';
import WizardLayout from '../components/layout/WizardLayout';
import StylePicker from '../components/customize/StylePicker';
import ThemePicker from '../components/customize/ThemePicker';
import VoicePicker from '../components/customize/VoicePicker';
import AgePicker from '../components/customize/AgePicker';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { STYLES, THEMES, VOICES } from '../lib/constants';
import { Style, Theme, VoiceType } from '../types';

const customizationSchema = z.object({
  style: z.enum(['storybook', 'watercolor']),
  theme: z.enum(['adventure', 'kindness', 'bravery', 'bedtime', 'friendship', 'counting', 'nature']),
  voice: z.enum(['gentle', 'cheerful']),
  age: z.number().min(2).max(9),
  personalContext: z.string().optional(),
});

type CustomizationFormValues = z.infer<typeof customizationSchema>;

export default function CustomizePage() {
  const { state, setCustomization } = useWizardState();
  const navigate = useNavigate();

  const form = useForm<CustomizationFormValues>({
    resolver: zodResolver(customizationSchema),
    defaultValues: {
      style: state.customization.style,
      theme: state.customization.theme,
      voice: state.customization.voice,
      age: state.customization.age,
      personalContext: state.customization.personalContext || '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    document.title = 'NoComelon | Customize';
    if (!state.analysis) {
      navigate('/recognize');
    }
  }, [state.analysis, navigate]);

  const handleNext = (data: CustomizationFormValues) => {
    setCustomization({
      style: data.style as Style,
      theme: data.theme as Theme,
      voice: data.voice as VoiceType,
      age: data.age,
      personalContext: data.personalContext,
    });
    navigate('/script');
  };

  if (!state.analysis) return null;

  return (
    <WizardLayout

      currentStep={3}
      actionLabel="Generate Story ✨"
      actionDisabled={!form.formState.isValid}
      actionLoading={false}
      onAction={form.handleSubmit(handleNext)}
    >
      <div className="space-y-8 pb-4 overscroll-contain">
        {/* 1. Visual Style */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">1</div>
            <Label className="font-semibold text-foreground text-base">Visual Style</Label>
          </div>
          <Controller
            name="style"
            control={form.control}
            render={({ field }) => (
              <StylePicker
                value={field.value}
                onChange={field.onChange}
                options={STYLES}
              />
            )}
          />
        </section>

        {/* 2. Story Theme */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-secondary/20 text-secondary-foreground flex items-center justify-center font-bold text-sm">2</div>
            <Label className="font-semibold text-foreground text-base">Story Theme</Label>
          </div>
          <Controller
            name="theme"
            control={form.control}
            render={({ field }) => (
              <ThemePicker
                value={field.value}
                onChange={field.onChange}
                options={THEMES}
              />
            )}
          />
        </section>

        {/* 3. Narrator Voice */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm">3</div>
            <Label className="font-semibold text-foreground text-base">Narrator Voice</Label>
          </div>
          <Controller
            name="voice"
            control={form.control}
            render={({ field }) => (
              <VoicePicker
                value={field.value}
                onChange={field.onChange}
                options={VOICES}
              />
            )}
          />
        </section>

        {/* 4. Child's Age */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">4</div>
            <Label className="font-semibold text-foreground text-base">Child's Age</Label>
          </div>
          <Controller
            name="age"
            control={form.control}
            render={({ field }) => (
              <AgePicker
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </section>

        {/* 5. Personal Touch */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-secondary/20 text-secondary-foreground flex items-center justify-center font-bold text-sm">5</div>
            <Label className="font-semibold text-foreground text-base">Personal Touch (Optional)</Label>
          </div>
          <Controller
            name="personalContext"
            control={form.control}
            render={({ field }) => (
              <Textarea
                {...field}
                placeholder="e.g., nervous about swim lessons, loves trains..."
                className="bg-card min-h-[80px]"
              />
            )}
          />
        </section>
      </div>
    </WizardLayout>
  );
}
