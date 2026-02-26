import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { WizardState, DrawingAnalysis, StoryScript, VideoResult } from '../types/index';
import { getJobStatus } from '../api/jobs';
import { useAuth } from './use-auth';

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
  const [state, setState] = useState<WizardState>(initialState);
  const { user } = useAuth();

  // Restore state from DynamoDB checkpoint on mount (if run_id exists in URL or state)
  const restoreFromCheckpoint = useCallback(async (runId: string, userId: string) => {
    try {
      const checkpoint = await getJobStatus(runId, userId);
      if (checkpoint && checkpoint.status === 'complete') {
        setState(prev => ({
          ...prev,
          run_id: runId,
          analysis: checkpoint.drawing_analysis as DrawingAnalysis | null,
          script: checkpoint.story_script as StoryScript | null,
          video: checkpoint.video as VideoResult | null,
        }));
      }
    } catch (e) {
      console.error('Failed to restore checkpoint:', e);
    }
  }, []);

  // Auto-restore if we have a run_id and user
  useEffect(() => {
    if (state.run_id && user?.userId && !state.analysis) {
      restoreFromCheckpoint(state.run_id, user.userId);
    }
  }, [state.run_id, user?.userId, state.analysis, restoreFromCheckpoint]);

  const setRunId = useCallback((run_id: string | null) => {
    setState((prev) => ({ ...prev, run_id }));
  }, []);

  const setDrawing = useCallback((drawing: File | null) => {
    setState((prev) => ({ ...prev, drawing }));
  }, []);

  const setAnalysis = useCallback((analysis: DrawingAnalysis | null) => {
    setState((prev) => ({ ...prev, analysis }));
  }, []);

  const setCustomization = useCallback((customization: Partial<WizardState['customization']>) => {
    setState((prev) => ({
      ...prev,
      customization: { ...prev.customization, ...customization },
    }));
  }, []);

  const setScript = useCallback((script: StoryScript | null) => {
    setState((prev) => ({ ...prev, script }));
  }, []);

  const setVideo = useCallback((video: VideoResult | null) => {
    setState((prev) => ({ ...prev, video }));
  }, []);

  const resetWizard = useCallback(() => {
    setState(initialState);
  }, []);

  const contextValue = useMemo(() => ({
    state,
    setRunId,
    setDrawing,
    setAnalysis,
    setCustomization,
    setScript,
    setVideo,
    resetWizard,
  }), [state, setRunId, setDrawing, setAnalysis, setCustomization, setScript, setVideo, resetWizard]);

  return (
    <WizardContext.Provider value={contextValue}>
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
