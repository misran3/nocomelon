import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { useWizardState } from '../hooks/use-wizard-state';
import { useJobPolling } from '../hooks/use-job-polling';
import WizardLayout from '../components/layout/WizardLayout';
import VideoPlayer from '../components/preview/VideoPlayer';
import { useLibrary } from '../hooks/use-library';
import { toast } from 'sonner';
import { generateVideo, PipelineRequest } from '../api';
import { useAuth } from '../hooks/use-auth';
import { useS3Url } from '../hooks/use-s3-url';
import { LibraryEntry, VideoResult } from '../types';

const STAGE_LABELS: Record<string, string> = {
  'images': 'Creating illustrations...',
  'voice': 'Recording narration...',
  'video': 'Assembling your storybook...',
};

export default function PreviewPage() {
  const { state, setVideo, resetWizard } = useWizardState();
  const { addStorybook } = useLibrary();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(true);
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const hasStartedPipeline = useRef(false);

  // S3 URL resolution for video playback
  const { url: videoUrl, isLoading: videoUrlLoading } = useS3Url(state.video?.video_key);
  const { url: posterUrl } = useS3Url(state.video?.thumbnail_key);

  // Polling hook for async pipeline
  const handlePollComplete = useCallback((data: { video: Record<string, unknown> | null }) => {
    if (data.video) {
      const video = data.video as unknown as VideoResult;
      setVideo(video);
      setIsGenerating(false);
    }
  }, [setVideo]);

  const handlePollError = useCallback((err: string) => {
    setError(err || 'Failed to generate video');
    toast.error('Failed to generate video');
    setIsGenerating(false);
  }, []);

  const { status, isPolling, startPolling } = useJobPolling(
    state.run_id,
    user?.userId ?? null,
    {
      onComplete: handlePollComplete,
      onError: handlePollError,
    }
  );

  useEffect(() => {
    document.title = 'NoComelon | Preview';
    if (!state.script || !state.analysis || !state.run_id) {
      navigate('/script', { replace: true });
      return;
    }

    // If video already exists, just show it
    if (state.video) {
      setIsGenerating(false);
      return;
    }

    // Guard: only start pipeline once
    if (hasStartedPipeline.current) {
      return;
    }
    hasStartedPipeline.current = true;

    async function runPipeline() {
      try {
        // Explicit null checks (defense-in-depth)
        if (!state.run_id || !state.script || !state.analysis || !user?.userId) {
          setError('Missing required data. Please start over.');
          setIsGenerating(false);
          return;
        }

        const request: PipelineRequest = {
          run_id: state.run_id,
          story: state.script,
          drawing: state.analysis,
          style: state.customization.style,
          voice_type: state.customization.voice,
          user_id: user.userId,
        };
        // API now returns immediately
        await generateVideo(request);
        // Start polling for results
        startPolling();
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to generate video';
        setError(message);
        toast.error('Failed to generate video');
        console.error('Pipeline error:', e);
        setIsGenerating(false);
      }
    }

    runPipeline();
  }, [state.script, state.analysis, state.run_id, state.video, state.customization, user, navigate, setVideo, startPolling]);

  const handleSave = async () => {
    if (!state.video || !state.run_id) return;

    const entry: LibraryEntry = {
      id: state.run_id,
      title: state.analysis?.subject || 'My Storybook',
      thumbnail_key: state.video.thumbnail_key,
      video_key: state.video.video_key,
      duration_sec: state.video.duration_sec,
      style: state.customization.style,
      created_at: new Date().toISOString(),
    };

    try {
      await addStorybook(entry);
      toast.success('Saved to library!');
      resetWizard();
      navigate('/library');
    } catch (e) {
      toast.error('Failed to save to library');
      console.error('Save error:', e);
    }
  };

  const handleDiscard = () => {
    resetWizard();
    navigate('/upload');
  };

  if (!state.script || !state.run_id) return null;

  if (isGenerating) {
    const currentStageLabel = status?.current_stage
      ? STAGE_LABELS[status.current_stage] || 'Processing...'
      : 'Creating your storybook...';

    return (
      <WizardLayout
        currentStep={5}
        actionLabel="Save to Library"
        actionDisabled={true}
        onAction={() => {}}
      >
        <div className="space-y-4 animate-in fade-in duration-300">
          {/* Video area skeleton */}
          <Skeleton className="aspect-video w-full rounded-2xl" />

          {/* Generating message card */}
          <div className="rounded-xl border bg-card p-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{currentStageLabel}</p>
          </div>

          {/* Metadata skeletons */}
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </WizardLayout>
    );
  }

  if (error) {
    return (
      <WizardLayout
        currentStep={5}
        actionLabel="Save to Library"
        actionDisabled={true}
        onAction={() => {}}
      >
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" onClick={() => navigate('/script')}>
            Go Back to Script
          </Button>
        </div>
      </WizardLayout>
    );
  }

  const minutes = Math.floor((state.video?.duration_sec || 0) / 60);
  const seconds = ((state.video?.duration_sec || 0) % 60).toString().padStart(2, '0');

  return (
    <WizardLayout
      currentStep={5}
      actionLabel="Save to Library"
      onAction={handleSave}
    >
      <div className="space-y-6 animate-in fade-in duration-500">
        <h1 className="text-xl font-bold">Preview your storybook</h1>

        <VideoPlayer
          src={videoUrl || ''}
          poster={posterUrl || ''}
        />

        <div>
          <p className="text-lg font-semibold">{state.analysis?.subject || 'My Storybook'}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            <span>{minutes}:{seconds}</span>
            <span>·</span>
            <span className="bg-secondary/20 text-secondary-foreground text-xs px-2 py-0.5 rounded-full capitalize">
              {state.customization.style}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/customize')}
          >
            Try different look
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
                Discard
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete your storybook.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDiscard} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </WizardLayout>
  );
}
