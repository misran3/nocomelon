import { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Maximize,
  Share2,
  Trash2
} from 'lucide-react';
import { LibraryEntry } from '../../types';
import { useS3Url } from '../../hooks/use-s3-url';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from '../ui/sheet';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '../ui/alert-dialog';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface StorybookSheetProps {
  storybook: LibraryEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => Promise<void>;  // Now async
}

export function StorybookSheet({ storybook, open, onOpenChange, onDelete }: StorybookSheetProps) {
  const { url: videoUrl } = useS3Url(storybook?.video_key);
  const { url: thumbnailUrl } = useS3Url(storybook?.thumbnail_key);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!storybook) return null;

  const handleShare = async () => {
    const shareUrl = `https://nocomelon.app/share/${storybook.id}`;
    await navigator.clipboard.writeText(shareUrl);
    toast("Link copied!");
  };

  const handleDelete = async () => {
    if (!storybook) return;
    setIsDeleting(true);
    try {
      await onDelete(storybook.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-[20px] p-0 flex flex-col overflow-hidden">
        <div className="p-5 pb-3">
          <SheetHeader className="text-left">
            <SheetTitle className="text-xl font-bold">{storybook.title}</SheetTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">
                {format(new Date(storybook.created_at), 'MMM d, yyyy')}
              </span>
              <span className="text-muted-foreground">·</span>
              <Badge variant="secondary" className="capitalize">
                {storybook.style}
              </Badge>
            </div>
          </SheetHeader>
        </div>

        <div className="flex-1 min-h-0 flex items-center justify-center px-5">
          <video
            className="max-w-full max-h-full rounded-2xl bg-black"
            controls
            src={videoUrl || ''}
            poster={thumbnailUrl || ''}
          />
        </div>

        <div className="p-5 pt-4 space-y-3 border-t bg-background">
          <Button 
            variant="default" 
            className="w-full h-12 rounded-xl"
            onClick={() => {}}
          >
            <Maximize className="mr-2 h-4 w-4" />
            Play Full Screen
          </Button>

          <Button 
            variant="outline" 
            className="w-full h-12 rounded-xl"
            onClick={handleShare}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share with Family
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full h-12 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Story
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Story?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this storybook. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  );
}
