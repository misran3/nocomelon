import React from 'react';
import { cn } from '../../lib/utils';
import { Volume2 } from 'lucide-react';
import { Button } from '../ui/button';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { toast } from 'sonner';

interface VoicePickerProps {
  value: string | null;
  onChange: (voiceId: string) => void;
  options: Array<{ id: string; label: string; description: string }>;
}

export default function VoicePicker({ value, onChange, options }: VoicePickerProps) {
  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast("Voice preview coming soon");
  };

  return (
    <RadioGroup value={value || ''} onValueChange={onChange} className="space-y-3">
      {options.map((option) => (
        <div
          key={option.id}
          className={cn(
            "flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all",
            value === option.id
              ? "bg-primary/5 border-primary"
              : "border-border hover:border-primary/30"
          )}
          onClick={() => onChange(option.id)}
        >
          <div className="flex-shrink-0 mr-3">
            <RadioGroupItem value={option.id} id={option.id} />
          </div>
          
          <div className="flex-1">
            <label htmlFor={option.id} className="font-medium text-foreground cursor-pointer block">
              {option.label}
            </label>
            <div className="text-sm text-muted-foreground">{option.description}</div>
          </div>
          
          <Button
            size="icon"
            variant="ghost"
            className="h-10 w-10 rounded-full"
            onClick={handlePreview}
            type="button"
          >
            <Volume2 className="w-5 h-5 text-muted-foreground" />
          </Button>
        </div>
      ))}
    </RadioGroup>
  );
}
