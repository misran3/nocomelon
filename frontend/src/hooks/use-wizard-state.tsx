import React, { createContext, useContext, useEffect, useState } from 'react';
import { WizardState, DrawingAnalysis, StoryScript, VideoResult } from '../types/index';

interface WizardContextType {
  state: WizardState;
  setRunId: (runId: string | null) => void;
  setDrawing: (drawing: File | null) => void;
  setAnalysis: (analysis: DrawingAnalysis | null) => void;
  setCustomization: (customization: Partial<WizardState['customization']>) => void;
  setScript: (script: StoryScript | null) => void;
  setVideo: (video: VideoResult | null) => void;
  resetWizard: () => void;
}

const initialState: WizardState = {
  run_id: null,
  drawing: null,
  analysis: null,
  customization: {
    style: 'storybook',
    theme: 'adventure',
    voice: 'gentle',
    age: 4,
    personalContext: '',
  },
  script: null,
  video: null,
};

const WizardContext = createContext<WizardContextType | undefined>(undefined);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WizardState>(() => {
    if (typeof window === 'undefined') return initialState;
    try {
      const saved = localStorage.getItem('nocomelon-wizard-state');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure drawing is null as it cannot be serialized
        // Merge with initialState to ensure all fields exist (e.g. if new fields are added later)
        return { 
          ...initialState, 
          ...parsed, 
          drawing: null,
          customization: {
            ...initialState.customization,
            ...(parsed.customization || {})
          }
        };
      }
    } catch (error) {
      console.error('Failed to parse wizard state from local storage', error);
    }
    return initialState;
  });

  useEffect(() => {
    try {
      // Exclude drawing from serialization
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { drawing, ...serializableState } = state;
      localStorage.setItem('nocomelon-wizard-state', JSON.stringify(serializableState));
    } catch (error) {
      console.error('Failed to save wizard state to local storage', error);
    }
  }, [state]);

  const setRunId = (run_id: string | null) => {
    setState((prev) => ({ ...prev, run_id }));
  };

  const setDrawing = (drawing: File | null) => {
    setState((prev) => ({ ...prev, drawing }));
  };

  const setAnalysis = (analysis: DrawingAnalysis | null) => {
    setState((prev) => ({ ...prev, analysis }));
  };

  const setCustomization = (customization: Partial<WizardState['customization']>) => {
    setState((prev) => ({
      ...prev,
      customization: { ...prev.customization, ...customization },
    }));
  };

  const setScript = (script: StoryScript | null) => {
    setState((prev) => ({ ...prev, script }));
  };

  const setVideo = (video: VideoResult | null) => {
    setState((prev) => ({ ...prev, video }));
  };

  const resetWizard = () => {
    setState(initialState);
    localStorage.removeItem('nocomelon-wizard-state');
  };

  return (
    <WizardContext.Provider
      value={{
        state,
        setRunId,
        setDrawing,
        setAnalysis,
        setCustomization,
        setScript,
        setVideo,
        resetWizard,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

export function useWizardState() {
  const context = useContext(WizardContext);
  if (context === undefined) {
    throw new Error('useWizardState must be used within a WizardProvider');
  }
  return context;
}
