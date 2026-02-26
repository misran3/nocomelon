import { useState, useEffect } from 'react';
import { getPresignedUrl } from '../api/storage';
import { useAuth } from './use-auth';

export function useS3Url(key: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!key || !user?.userId) {
      setUrl(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    // Use backend API to generate pre-signed URL
    getPresignedUrl(key, user.userId)
      .then(({ url }) => {
        if (!cancelled) {
          setUrl(url);
          setIsLoading(false);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          console.error('S3 URL resolution failed for key:', key, e);
          setError(e instanceof Error ? e.message : 'Failed to get URL');
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [key, user?.userId]);

  return { url, isLoading, error };
}
