import React, { useState, useEffect } from 'react';
import AppHeader from '../components/layout/AppHeader';
import { StorybookCard } from '../components/library/StorybookCard';
import { StorybookSheet } from '../components/library/StorybookSheet';
import { useLibrary } from '../hooks/use-library';
import { LibraryEntry } from '../types';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { CONTENT_WIDTH } from '../lib/utils';

export default function LibraryPage() {
  const navigate = useNavigate();
  const { library, isLoading, error, removeStorybook } = useLibrary();
  const [selectedStory, setSelectedStory] = useState<LibraryEntry | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    document.title = 'NoComelon | Library';
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />
        <main className={`flex-1 pt-20 px-4 pb-24 ${CONTENT_WIDTH} w-full`}>
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader />
        <main className={`flex-1 pt-20 px-4 pb-24 ${CONTENT_WIDTH} w-full flex flex-col items-center justify-center`}>
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </main>
      </div>
    );
  }

  const handleStoryClick = (story: LibraryEntry) => {
    setSelectedStory(story);
    setSheetOpen(true);
  };

  const handleCreateNew = () => {
    navigate('/upload');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      
      <main className={`flex-1 pt-20 px-4 pb-24 ${CONTENT_WIDTH} w-full`}>
        {library.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">Your Creations</h1>
                <div className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold">
                  {library.length}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleCreateNew}
                className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {library.map((story) => (
                <StorybookCard
                  key={story.id}
                  storybook={story}
                  onClick={() => handleStoryClick(story)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="text-7xl mb-4">📚✨</div>
            <h2 className="text-xl font-bold mt-4">No storybooks yet</h2>
            <p className="text-muted-foreground text-sm mt-2">
              Upload a drawing to create your first story
            </p>
            <Button onClick={handleCreateNew} className="mt-6 w-full">
              Create Story
            </Button>
          </div>
        )}
      </main>

      <StorybookSheet 
        storybook={selectedStory} 
        open={sheetOpen} 
        onOpenChange={setSheetOpen} 
        onDelete={async (id) => {
          await removeStorybook(id);
          setSheetOpen(false);
          toast.success('Storybook deleted');
        }}
      />
    </div>
  );
}
