import { cn } from '../../lib/utils';

interface AgePickerProps {
  value: number | null;
  onChange: (age: number) => void;
  min?: number; // default 2
  max?: number; // default 9
}

export default function AgePicker({ 
  value, 
  onChange, 
  min = 2, 
  max = 9 
}: AgePickerProps) {
  const ages = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  return (
    <div className="flex flex-row gap-2">
      {ages.map((age) => (
        <button
          key={age}
          onClick={() => onChange(age)}
          className={cn(
            "w-10 h-10 rounded-lg text-sm font-medium transition-all flex items-center justify-center",
            value === age
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {age}
        </button>
      ))}
    </div>
  );
}
