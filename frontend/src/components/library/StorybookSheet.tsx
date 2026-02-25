import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  Play, 
  Maximize, 
  Share2, 
  Trash2 
} from 'lucide-react';
import { StorybookEntry } from '../../types';
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
  storybook: StorybookEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
}

export function StorybookSheet({ storybook, open, onOpenChange, onDelete }: StorybookSheetProps) {
  if (!storybook) return null;

  const handleShare = async () => {
    const shareUrl = `https://nocomelon.app/share/${storybook.id}`;
    await navigator.clipboard.writeText(shareUrl);
    toast("Link copied!");
  };

  const handleDelete = () => {
    onDelete(storybook.id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-[20px] p-0 flex flex-col overflow-hidden">
        <div className="p-5 pb-3">
          <SheetHeader className="text-left">
            <SheetTitle className="text-xl font-bold">{storybook.title}</SheetTitle>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">
                {format(storybook.createdAt, 'MMM d, yyyy')}
              </span>
              <span className="text-muted-foreground">·</span>
              <Badge variant="secondary" className="capitalize">
                {storybook.style}
              </Badge>
            </div>
          </SheetHeader>
        </div>

        <div className="relative w-full aspect-video bg-gray-200 flex items-center justify-center">
          <Play className="w-16 h-16 text-gray-400" />
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
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  );
}
