import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { getLibrary, saveToLibrary, deleteFromLibrary } from '../api';
import { LibraryEntry } from '../types';

export function useLibrary() {
  const { user } = useAuth();
  const [library, setLibrary] = useState<LibraryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    async function fetchLibrary() {
      try {
        const data = await getLibrary(user!.userId);
        setLibrary(data);
        setError(null);
      } catch (e) {
        setError('Failed to load library');
        console.error('Failed to load library:', e);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLibrary();
  }, [user]);

  const addStorybook = async (entry: LibraryEntry) => {
    if (!user) throw new Error('Not authenticated');
    await saveToLibrary(entry, user.userId);
    setLibrary((prev) => [entry, ...prev]);
  };

  const removeStorybook = async (id: string) => {
    if (!user) throw new Error('Not authenticated');
    await deleteFromLibrary(id, user.userId);
    setLibrary((prev) => prev.filter((item) => item.id !== id));
  };

  const getStorybook = (id: string) => {
    return library.find((item) => item.id === id);
  };

  return {
    library,
    isLoading,
    error,
    addStorybook,
    removeStorybook,
    getStorybook,
  };
}
