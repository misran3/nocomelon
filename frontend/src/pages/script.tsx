import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { useWizardState } from '../hooks/use-wizard-state';
import WizardLayout from '../components/layout/WizardLayout';
import SceneEditor from '../components/script/SceneEditor';
import { generateStory } from '../api';
import { toast } from 'sonner';
import { Scene, StoryScript } from '../types';

export default function ScriptPage() {
  const { state, setScript } = useWizardState();
  const navigate = useNavigate();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = 'NoComelon | Script';
    if (!state.analysis || !state.customization.style) {
      navigate('/customize', { replace: true });
      return;
    }

    async function fetchStory() {
      try {
        const script = await generateStory({
          drawing: state.analysis!,
          theme: state.customization.theme,
          voice_type: state.customization.voice,
          child_age: state.customization.age,
          personal_context: state.customization.personalContext || undefined,
        });
        setScenes(script.scenes);
        setScript(script);
      } catch (error) {
        toast.error('Failed to generate story');
        console.error('Failed to generate story:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStory();
  }, [state.analysis, state.customization, navigate, setScript]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const script = await generateStory({
        drawing: state.analysis!,
        theme: state.customization.theme,
        voice_type: state.customization.voice,
        child_age: state.customization.age,
        personal_context: state.customization.personalContext || undefined,
      });
      setScenes(script.scenes);
      setScript(script);
    } catch (error) {
      toast.error('Failed to regenerate story');
      console.error('Failed to regenerate story:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSceneChange = (index: number, text: string) => {
    const newScenes = [...scenes];
    newScenes[index] = { ...newScenes[index], text };
    setScenes(newScenes);
  };

  const handleAction = () => {
    const script: StoryScript = {
      scenes,
      total_scenes: scenes.length
    };
    setScript(script);
    navigate('/preview');
  };

  if (!state.analysis || !state.customization.style) return null;

  if (isLoading) {

    return (
      <WizardLayout
        currentStep={4}
        actionLabel="Create Video"
        actionDisabled={true}
        onAction={() => {}}
      >
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-xl border p-4 space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-3 w-16 ml-auto" />
            </div>
          ))}
        </div>
      </WizardLayout>
    );
  }

  return (
    <WizardLayout
      currentStep={4}
      actionLabel="Create Video"
      actionDisabled={isRegenerating}
      onAction={handleAction}
    >
        <div className="space-y-6 animate-in fade-in duration-300">
          <div>
            <h2 className="text-2xl font-bold">Review your story</h2>
          <p className="text-muted-foreground text-sm">Edit any text below</p>
        </div>

        <Button
          variant="outline"
          className="w-full"
          disabled={isRegenerating}
          onClick={handleRegenerate}
        >
          {isRegenerating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Regenerate Story
            </>
          )}
        </Button>

        {isRegenerating ? (
          <div className="space-y-4">
            {scenes.map((_, i) => (
              <div key={i} className="rounded-xl border p-4 space-y-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-3 w-16 ml-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-300">
            {scenes.map((scene, index) => (
              <SceneEditor
                key={index}
                scene={scene}
                onChange={(text) => handleSceneChange(index, text)}
              />
            ))}
          </div>
        )}
      </div>
    </WizardLayout>
  );
}
