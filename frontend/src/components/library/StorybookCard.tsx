import { LibraryEntry } from '../../types';
import { useS3Url } from '../../hooks/use-s3-url';
import { Skeleton } from '../ui/skeleton';
import { Image } from 'lucide-react';

interface StorybookCardProps {
  storybook: LibraryEntry;
  onClick: () => void;
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function StorybookCard({ storybook, onClick }: StorybookCardProps) {
  const { url: thumbnailUrl, isLoading } = useS3Url(storybook.thumbnail_key);

  return (
    <div
      onClick={onClick}
      className="relative aspect-square overflow-hidden rounded-xl cursor-pointer hover:scale-[1.02] transition-transform duration-200 group"
    >
      {isLoading ? (
        <Skeleton className="absolute inset-0" />
      ) : thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt={storybook.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <Image className="w-8 h-8 text-gray-400" />
        </div>
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-2 flex items-end justify-between z-10">
        <div className="text-white text-sm font-medium truncate flex-1 mr-2" title={storybook.title}>
          {storybook.title}
        </div>
        <div className="text-white text-xs shrink-0 bg-black/30 rounded px-1 py-0.5 backdrop-blur-sm">
          {formatDuration(storybook.duration_sec)}
        </div>
      </div>
    </div>
  );
}
