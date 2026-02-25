import { cn } from '../../lib/utils';
import { STEP_LABELS, TOTAL_STEPS } from '../../lib/mock-data';

interface ProgressBarProps {
  currentStep: number;
  totalSteps?: number;
  onStepClick?: (step: number) => void;
}

export function ProgressBar({ currentStep, totalSteps = TOTAL_STEPS, onStepClick }: ProgressBarProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const step = i + 1;
          const isCompleted = step < currentStep;
          const isCurrent = step === currentStep;
          const isLast = step === totalSteps;

          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              {/* Step circle + label */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => isCompleted && onStepClick?.(step)}
                  disabled={!isCompleted}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200",
                    "disabled:opacity-100 disabled:cursor-not-allowed",
                    isCompleted && "bg-secondary text-secondary-foreground cursor-pointer hover:opacity-80",
                    isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    !isCompleted && !isCurrent && "border-2 border-gray-300 text-gray-400 cursor-default"
                  )}
                  type="button"
                  aria-label={`Step ${step}: ${STEP_LABELS[i] ?? `Step ${step}`}`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {step}
                </button>
                {/* Label - hidden on mobile, visible on md+ */}
                <span
                  className={cn(
                    "hidden md:block mt-2 text-xs font-medium text-center whitespace-nowrap",
                    isCurrent && "text-primary font-semibold",
                    isCompleted && "text-secondary",
                    !isCompleted && !isCurrent && "text-muted-foreground"
                  )}
                >
                  {STEP_LABELS[i] ?? `Step ${step}`}
                </span>
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2",
                    step < currentStep ? "bg-secondary" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ProgressBar;
