import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useWizardState } from '../hooks/use-wizard-state';
import WizardLayout from '../components/layout/WizardLayout';
import { ImageUploader } from '../components/upload/ImageUploader';
import { toast } from 'sonner';

export default function UploadPage() {
  const { state, setDrawing } = useWizardState();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'NoComelon | Upload';
  }, []);

  const handleImageUpload = (value: File | null) => {
    try {
      setDrawing(value);
    } catch (error) {
      toast.error("Failed to upload image. Please try again.");
    }
  };

  const handleNext = () => {
    if (!state.drawing) return;
    navigate('/recognize');
  };

  return (
    <WizardLayout
      currentStep={1}
      actionLabel="Analyze Drawing"
      actionDisabled={!state.drawing}
      onAction={handleNext}
    >
      <div className="space-y-6 pt-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Upload your child's drawing</h2>
          <p className="text-muted-foreground">Take a photo or choose from camera roll</p>
        </div>
        <ImageUploader value={state.drawing} onChange={handleImageUpload} />
      </div>
    </WizardLayout>
  );
}
