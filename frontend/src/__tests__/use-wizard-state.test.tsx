import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { WizardProvider, useWizardState } from '../hooks/use-wizard-state';
import { ReactNode } from 'react';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

const wrapper = ({ children }: { children: ReactNode }) => (
  <WizardProvider>{children}</WizardProvider>
);

describe('useWizardState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('setter reference stability', () => {
    it('setRunId maintains stable reference across re-renders', () => {
      const { result, rerender } = renderHook(() => useWizardState(), { wrapper });

      const firstSetRunId = result.current.setRunId;

      // Trigger a re-render by updating state
      act(() => {
        result.current.setRunId('test-id');
      });

      rerender();

      // setRunId should be the same reference
      expect(result.current.setRunId).toBe(firstSetRunId);
    });

    it('setScript maintains stable reference across re-renders', () => {
      const { result, rerender } = renderHook(() => useWizardState(), { wrapper });

      const firstSetScript = result.current.setScript;

      act(() => {
        result.current.setScript({ scenes: [], total_scenes: 0 });
      });

      rerender();

      expect(result.current.setScript).toBe(firstSetScript);
    });

    it('setVideo maintains stable reference across re-renders', () => {
      const { result, rerender } = renderHook(() => useWizardState(), { wrapper });

      const firstSetVideo = result.current.setVideo;

      act(() => {
        result.current.setVideo({
          video_key: 'test-key',
          duration_sec: 30,
          thumbnail_key: 'thumb-key',
        });
      });

      rerender();

      expect(result.current.setVideo).toBe(firstSetVideo);
    });
  });

  describe('state updates', () => {
    it('setRunId updates state correctly', () => {
      const { result } = renderHook(() => useWizardState(), { wrapper });

      act(() => {
        result.current.setRunId('abc123');
      });

      expect(result.current.state.run_id).toBe('abc123');
    });

    it('resetWizard clears all state', () => {
      const { result } = renderHook(() => useWizardState(), { wrapper });

      // Set some state
      act(() => {
        result.current.setRunId('test');
        result.current.setScript({ scenes: [], total_scenes: 0 });
      });

      // Reset
      act(() => {
        result.current.resetWizard();
      });

      expect(result.current.state.run_id).toBeNull();
      expect(result.current.state.script).toBeNull();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('nocomelon-wizard-state');
    });
  });
});
