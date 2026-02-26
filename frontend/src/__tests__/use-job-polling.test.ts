import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useJobPolling } from '../hooks/use-job-polling';

// Mock the API
vi.mock('@/api/jobs', () => ({
  getJobStatus: vi.fn(),
}));

import { getJobStatus } from '@/api/jobs';
const mockGetJobStatus = vi.mocked(getJobStatus);

describe('useJobPolling', () => {
  beforeEach(() => {
    mockGetJobStatus.mockReset();
  });

  it('should not poll when runId is null', () => {
    const { result } = renderHook(() =>
      useJobPolling(null, 'user123', { pollInterval: 1000 })
    );

    act(() => {
      result.current.startPolling();
    });

    expect(result.current.isPolling).toBe(false);
    expect(mockGetJobStatus).not.toHaveBeenCalled();
  });

  it('should not poll when userId is null', () => {
    const { result } = renderHook(() =>
      useJobPolling('run123', null, { pollInterval: 1000 })
    );

    act(() => {
      result.current.startPolling();
    });

    expect(result.current.isPolling).toBe(false);
    expect(mockGetJobStatus).not.toHaveBeenCalled();
  });

  it('should start polling when runId and userId are available', async () => {
    mockGetJobStatus.mockResolvedValue({
      user_id: 'user123',
      run_id: 'run123',
      status: 'processing',
      current_stage: 'vision',
      error: null,
      drawing_analysis: null,
      story_script: null,
      images: null,
      video: null,
      updated_at: null,
    });

    const { result } = renderHook(() =>
      useJobPolling('run123', 'user123', { pollInterval: 1000 })
    );

    act(() => {
      result.current.startPolling();
    });

    expect(result.current.isPolling).toBe(true);

    await waitFor(() => {
      expect(mockGetJobStatus).toHaveBeenCalledWith('run123', 'user123');
    });
  });

  it('should call onComplete when status is complete', async () => {
    const onComplete = vi.fn();
    const completedStatus = {
      user_id: 'user123',
      run_id: 'run123',
      status: 'complete' as const,
      current_stage: 'vision_complete',
      error: null,
      drawing_analysis: { subject: 'cat', setting: 'garden', details: [], mood: 'happy', colors: ['orange'] },
      story_script: null,
      images: null,
      video: null,
      updated_at: null,
    };
    mockGetJobStatus.mockResolvedValue(completedStatus);

    const { result } = renderHook(() =>
      useJobPolling('run123', 'user123', { onComplete, pollInterval: 1000 })
    );

    act(() => {
      result.current.startPolling();
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(completedStatus);
    });

    expect(result.current.isPolling).toBe(false);
  });

  it('should call onError when status is error', async () => {
    const onError = vi.fn();
    mockGetJobStatus.mockResolvedValue({
      user_id: 'user123',
      run_id: 'run123',
      status: 'error' as const,
      current_stage: 'vision',
      error: 'Something went wrong',
      drawing_analysis: null,
      story_script: null,
      images: null,
      video: null,
      updated_at: null,
    });

    const { result } = renderHook(() =>
      useJobPolling('run123', 'user123', { onError, pollInterval: 1000 })
    );

    act(() => {
      result.current.startPolling();
    });

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('Something went wrong');
    });

    expect(result.current.isPolling).toBe(false);
  });

  it('should auto-start polling when runId becomes available after startPolling is called', async () => {
    mockGetJobStatus.mockResolvedValue({
      user_id: 'user123',
      run_id: 'run123',
      status: 'processing',
      current_stage: 'vision',
      error: null,
      drawing_analysis: null,
      story_script: null,
      images: null,
      video: null,
      updated_at: null,
    });

    // Start with null runId (simulating the async state update scenario)
    const { result, rerender } = renderHook(
      ({ runId, userId }) => useJobPolling(runId, userId, { pollInterval: 1000 }),
      { initialProps: { runId: null as string | null, userId: 'user123' } }
    );

    // Call startPolling while runId is still null
    act(() => {
      result.current.startPolling();
    });

    // Should not be polling yet (runId is null)
    expect(result.current.isPolling).toBe(false);
    expect(mockGetJobStatus).not.toHaveBeenCalled();

    // Now runId becomes available (simulating React state update)
    rerender({ runId: 'run123', userId: 'user123' });

    // Should auto-start polling now
    await waitFor(() => {
      expect(result.current.isPolling).toBe(true);
    });

    await waitFor(() => {
      expect(mockGetJobStatus).toHaveBeenCalledWith('run123', 'user123');
    });
  });

  it('should stop polling when stopPolling is called', async () => {
    mockGetJobStatus.mockResolvedValue({
      user_id: 'user123',
      run_id: 'run123',
      status: 'processing',
      current_stage: 'vision',
      error: null,
      drawing_analysis: null,
      story_script: null,
      images: null,
      video: null,
      updated_at: null,
    });

    const { result } = renderHook(() =>
      useJobPolling('run123', 'user123', { pollInterval: 1000 })
    );

    act(() => {
      result.current.startPolling();
    });

    expect(result.current.isPolling).toBe(true);

    act(() => {
      result.current.stopPolling();
    });

    expect(result.current.isPolling).toBe(false);
  });
});
