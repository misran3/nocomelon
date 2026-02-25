import { useRef, useEffect } from 'react';
import { Scene } from '../../types';

interface Props {
  scene: Scene;
  onChange: (text: string) => void;
}

export default function SceneEditor({ scene, onChange }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [scene.text]);

  return (
    <div className="rounded-xl p-4 bg-card border">
      <div className="text-sm font-medium text-muted-foreground mb-2">
        Scene {scene.number}
      </div>
      <textarea
        ref={textareaRef}
        className="border-none bg-transparent resize-none w-full outline-none focus:outline-none text-sm leading-relaxed"
        rows={3}
        value={scene.text}
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="text-xs text-muted-foreground mt-2 text-right">
        {scene.text.length} chars
      </div>
    </div>
  );
}
