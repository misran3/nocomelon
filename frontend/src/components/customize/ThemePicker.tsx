import { cn } from '../../lib/utils';

interface ThemeOption {
  id: string;
  label: string;
  icon: string;
}

interface ThemePickerProps {
  value: string | null;
  onChange: (themeId: string) => void;
  options: ThemeOption[];
}

export default function ThemePicker({ value, onChange, options }: ThemePickerProps) {
  return (
    <div className="overflow-x-auto">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              "rounded-full px-3 py-2 text-sm transition-all cursor-pointer flex items-center gap-2",
              value === option.id
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-foreground"
            )}
            type="button"
          >
            <span>{option.icon}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
