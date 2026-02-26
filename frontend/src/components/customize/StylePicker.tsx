import { cn } from "../../lib/utils";

interface StylePickerProps {
  value: string | null;
  onChange: (styleId: string) => void;
  options: Array<{ id: string; label: string; icon: string }>;
}

export default function StylePicker({ value, onChange, options }: StylePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((option) => (
        <div
          key={option.id}
          onClick={() => onChange(option.id)}
          className={cn(
            "rounded-xl p-4 cursor-pointer transition-all border-2",
            value === option.id
              ? "border-primary bg-primary/5"
              : "border-muted hover:border-primary/50"
          )}
        >
          <div className="text-4xl text-center">{option.icon}</div>
          <div className="font-medium text-center text-sm mt-2">{option.label}</div>
        </div>
      ))}
    </div>
  );
}
