import { useState } from 'react';
import { Play } from 'lucide-react';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  onEnded?: () => void;
}

export default function VideoPlayer({ src, poster, onEnded }: VideoPlayerProps) {
  const [hasError, setHasError] = useState(false);

  const isYoutube = src?.includes('youtube.com/embed') || src?.includes('youtu.be');

  if (hasError || !src) {
    return (
      <div className="aspect-video rounded-2xl bg-muted flex flex-col items-center justify-center gap-2">
        <Play className="w-12 h-12 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Video preview</span>
      </div>
    );
  }

  if (isYoutube) {
    return (
      <div className="aspect-video rounded-2xl overflow-hidden bg-black">
        <iframe
          title="Storybook video"
          className="w-full h-full"
          src={`${src}?rel=0&modestbranding=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          frameBorder="0"
        />
      </div>
    );
  }

  return (
    <div className="aspect-video rounded-2xl overflow-hidden bg-black">
      <video
        className="w-full h-full object-contain"
        controls
        src={src}
        poster={poster}
        onEnded={onEnded}
        onError={() => setHasError(true)}
      />
    </div>
  );
}
