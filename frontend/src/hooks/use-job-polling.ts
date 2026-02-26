import { useState, useEffect, useCallback, useRef } from 'react';
import { getJobStatus, JobStatus } from '@/api/jobs';

interface UseJobPollingOptions {
  onComplete?: (status: JobStatus) => void;
  onError?: (error: string) => void;
  pollInterval?: number;
}

export function useJobPolling(
  runId: string | null,
  userId: string | null,
  options: UseJobPollingOptions = {}
) {
  const { onComplete, onError, pollInterval = 2000 } = options;
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  // Track if polling was requested (even before runId is available)
  const shouldPollRef = useRef(false);

  const startPolling = useCallback(() => {
    shouldPollRef.current = true;
    if (runId && userId) {
      setIsPolling(true);
    }
    // If runId/userId not yet available, the useEffect below will start polling when they become available
  }, [runId, userId]);

  const stopPolling = useCallback(() => {
    shouldPollRef.current = false;
    setIsPolling(false);
  }, []);

  // Auto-start polling when runId becomes available (if startPolling was called)
  useEffect(() => {
    if (shouldPollRef.current && runId && userId && !isPolling) {
      setIsPolling(true);
    }
  }, [runId, userId, isPolling]);

  useEffect(() => {
    if (!isPolling || !runId || !userId) return;

    let timeoutId: NodeJS.Timeout;
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        const data = await getJobStatus(runId, userId);
        if (cancelled) return;
        setStatus(data);

        if (data.status === 'complete') {
          setIsPolling(false);
          shouldPollRef.current = false;
          onComplete?.(data);
        } else if (data.status === 'error') {
          setIsPolling(false);
          shouldPollRef.current = false;
          onError?.(data.error || 'Unknown error');
        } else {
          timeoutId = setTimeout(poll, pollInterval);
        }
      } catch (e) {
        if (cancelled) return;
        console.error('Poll failed:', e);
        // Continue polling on network errors
        timeoutId = setTimeout(poll, pollInterval);
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isPolling, runId, userId, pollInterval, onComplete, onError]);

  return { status, isPolling, startPolling, stopPolling };
}
