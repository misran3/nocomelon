import { Slider } from '../ui/slider';

interface AgePickerProps {
  value: number | null;
  onChange: (age: number) => void;
  min?: number;
  max?: number;
}

export default function AgePicker({
  value,
  onChange,
  min = 2,
  max = 9
}: AgePickerProps) {
  const currentValue = value ?? min;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center">
        <span className="text-4xl font-bold text-primary">{currentValue}</span>
        <span className="text-lg text-muted-foreground ml-2">years old</span>
      </div>
      <div className="px-2">
        <Slider
          value={[currentValue]}
          onValueChange={([val]) => onChange(val)}
          min={min}
          max={max}
          step={1}
        />
        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );
}
