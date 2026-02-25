import { cn } from '../../lib/utils';

interface ProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  onStepClick?: (step: number) => void;
}

export function ProgressBar({ currentStep, totalSteps = 6, onStepClick }: ProgressBarProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;

        if (isCompleted) {
          return (
            <button
              key={step}
              onClick={() => onStepClick?.(step)}
              className={cn(
                "w-2.5 h-2.5 rounded-full bg-secondary cursor-pointer transition-all duration-200",
                "hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
              )}
              aria-label={`Go to step ${step}`}
              type="button"
            />
          );
        }

        if (isCurrent) {
          return (
            <span
              key={step}
              className="w-3 h-3 rounded-full bg-primary transition-all duration-200"
              aria-current="step"
            />
          );
        }

        // Future
        return (
          <span
            key={step}
            className="w-2.5 h-2.5 rounded-full border-2 border-gray-300 bg-transparent transition-all duration-200"
          />
        );
      })}
    </div>
  );
}

export default ProgressBar;
