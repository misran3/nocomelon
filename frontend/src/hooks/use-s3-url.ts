import { useState, useEffect } from 'react';
import { getUrl } from 'aws-amplify/storage';

export function useS3Url(key: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!key) {
      setUrl(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    // Amplify v6 uses 'path' instead of 'key'
    getUrl({ path: key })
      .then(({ url }) => {
        if (!cancelled) {
          setUrl(url.toString());
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
  }, [key]);

  return { url, isLoading, error };
}
