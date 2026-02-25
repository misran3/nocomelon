import React from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Loader2 } from 'lucide-react';
import AppHeader from './AppHeader';
import { ProgressBar } from './ProgressBar';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface WizardLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  actionLabel: string;
  actionDisabled?: boolean;
  actionLoading?: boolean;
  onAction: () => void;
  onBack?: () => void;
  showProgress?: boolean;
}

export default function WizardLayout({
  children,
  currentStep,
  actionLabel,
  actionDisabled,
  actionLoading,
  onAction,
  onBack,
  showProgress = true,
}: WizardLayoutProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      
      {showProgress && (
        <div className="fixed top-14 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-3 border-b">
           <div className="max-w-md mx-auto px-4">
             <ProgressBar currentStep={currentStep} totalSteps={6} />
           </div>
        </div>
      )}

      <main 
        className={cn("flex-1 pb-24 overflow-y-auto", showProgress ? "pt-[108px]" : "pt-16")}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="max-w-md mx-auto px-4">
          {children}
        </div>
      </main>

      <div 
        className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="max-w-md mx-auto px-4 py-3 flex gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
          )}
          
          <Button
            className="flex-1 rounded-xl h-12 text-base font-semibold"
            onClick={onAction}
            disabled={actionDisabled || actionLoading}
          >
            {actionLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Please wait
              </>
            ) : (
              actionLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
