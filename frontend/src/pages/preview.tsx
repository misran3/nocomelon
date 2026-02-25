import { useEffect, useState } from 'react';
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
import WizardLayout from '../components/layout/WizardLayout';
import VideoPlayer from '../components/preview/VideoPlayer';
import { MOCK_VIDEO } from '../lib/mock-data';
import { useLibrary } from '../hooks/use-library';
import { StorybookEntry } from '../types';
import { toast } from 'sonner';

export default function PreviewPage() {
  const { state, setVideo, resetWizard } = useWizardState();
  const { addStorybook } = useLibrary();
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    document.title = 'NoComelon | Preview';
    if (!state.script) {
      navigate('/script');
      return;
    }

    const timer = setTimeout(() => {
      setIsGenerating(false);
      if (!state.video) {
        setVideo(MOCK_VIDEO);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [state.script, state.video, setVideo, navigate]);

  const handleSave = () => {
    const video = state.video ?? MOCK_VIDEO;

    const entry: StorybookEntry = {
      id: Math.random().toString(36).substr(2, 9),
      title: "Dino's First Day",
      thumbnail: video.thumbnail,
      duration_sec: video.duration_sec,
      style: state.customization.style || 'storybook',
      createdAt: new Date()
    };

    addStorybook(entry);
    toast.success("Saved to library!");
    navigate('/library');
  };

  const handleDiscard = () => {
    resetWizard();
    navigate('/upload');
  };

  if (!state.script) return null;

  if (isGenerating) {

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
            <p className="text-sm font-medium text-muted-foreground">Creating your storybook...</p>
          </div>
          
          {/* Metadata skeletons */}
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </WizardLayout>
    );
  }

  // Fallback if video is still missing after generating (shouldn't happen with mock)
  // if (!state.video) return null;

  const minutes = Math.floor(MOCK_VIDEO.duration_sec / 60);
  const seconds = (MOCK_VIDEO.duration_sec % 60).toString().padStart(2, '0');

  return (
    <WizardLayout
      currentStep={5}
      actionLabel="Save to Library"
      onAction={handleSave}
    >
      <div className="space-y-6 animate-in fade-in duration-500">
        <h1 className="text-xl font-bold">Preview your storybook</h1>
        
        <VideoPlayer 
          src={MOCK_VIDEO.video_path} 
          poster={MOCK_VIDEO.thumbnail} 
        />

        <div>
          <p className="text-lg font-semibold">Dino's First Day</p>
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
