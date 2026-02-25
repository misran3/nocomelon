import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { RefreshCw } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { useWizardState } from '../hooks/use-wizard-state';
import { useAuth } from '../hooks/use-auth';
import WizardLayout from '../components/layout/WizardLayout';
import SceneEditor from '../components/script/SceneEditor';
import { generateStory } from '../api';
import { toast } from 'sonner';
import { Scene, StoryScript } from '../types';

export default function ScriptPage() {
  const { state, setScript } = useWizardState();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const generateStoryRequest = useCallback(() => {
    if (!state.analysis) return null;
    return {
      drawing: state.analysis,
      theme: state.customization.theme,
      voice_type: state.customization.voice,
      child_age: state.customization.age,
      personal_context: state.customization.personalContext || undefined,
      user_id: user?.userId,
      run_id: state.run_id || undefined,
    };
  }, [state.analysis, state.customization, state.run_id, user?.userId]);

  const doGenerateStory = useCallback(async () => {
    const request = generateStoryRequest();
    if (!request) {
      setError('Missing drawing analysis');
      return null;
    }

    setError(null);
    const script = await generateStory(request);
    setScenes(script.scenes);
    setScript(script);
    return script;
  }, [generateStoryRequest, setScript]);

  useEffect(() => {
    document.title = 'NoComelon | Script';
    if (!state.analysis || !state.customization.style) {
      navigate('/customize', { replace: true });
      return;
    }

    // Guard: only fetch once, or if script already exists
    if (hasFetched.current || state.script) {
      if (state.script) {
        setScenes(state.script.scenes);
        setIsLoading(false);
      }
      return;
    }
    hasFetched.current = true;

    async function fetchStory() {
      try {
        await doGenerateStory();
      } catch (err) {
        setError('Failed to generate story. Please try again.');
        console.error('Failed to generate story:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStory();
  }, [state.analysis, state.customization, state.script, navigate, doGenerateStory]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await doGenerateStory();
    } catch (err) {
      setError('Failed to regenerate story. Please try again.');
      console.error('Failed to regenerate story:', err);
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

  if (error && !isLoading && !isRegenerating) {
    return (
      <WizardLayout
        currentStep={4}
        actionLabel="Create Video"
        actionDisabled={true}
        onAction={() => {}}
      >
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" onClick={handleRegenerate}>
            Try Again
          </Button>
        </div>
      </WizardLayout>
    );
  }

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
