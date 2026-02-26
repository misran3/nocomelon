import { useState, useEffect, useCallback } from 'react';
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

  const startPolling = useCallback(() => {
    if (runId && userId) {
      setIsPolling(true);
    }
  }, [runId, userId]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (!isPolling || !runId || !userId) return;

    let timeoutId: NodeJS.Timeout;

    const poll = async () => {
      try {
        const data = await getJobStatus(runId, userId);
        setStatus(data);

        if (data.status === 'complete') {
          setIsPolling(false);
          onComplete?.(data);
        } else if (data.status === 'error') {
          setIsPolling(false);
          onError?.(data.error || 'Unknown error');
        } else {
          timeoutId = setTimeout(poll, pollInterval);
        }
      } catch (e) {
        console.error('Poll failed:', e);
        // Continue polling on network errors
        timeoutId = setTimeout(poll, pollInterval);
      }
    };

    poll();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isPolling, runId, userId, pollInterval, onComplete, onError]);

  return { status, isPolling, startPolling, stopPolling };
}
