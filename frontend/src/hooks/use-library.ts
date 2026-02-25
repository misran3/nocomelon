import { useState, useEffect } from 'react';
import { StorybookEntry } from '../types';
import { MOCK_LIBRARY } from '../lib/mock-data';

export function useLibrary() {
  const [library, setLibrary] = useState<StorybookEntry[]>(() => {
    if (typeof window === 'undefined') return MOCK_LIBRARY;
    
    const stored = localStorage.getItem('nocomelon-library');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Restore Date objects from JSON strings
        return parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt)
        }));
      } catch (error) {
        console.error('Failed to parse stored library:', error);
        return MOCK_LIBRARY;
      }
    }
    return MOCK_LIBRARY;
  });

  useEffect(() => {
    localStorage.setItem('nocomelon-library', JSON.stringify(library));
  }, [library]);

  const addStorybook = (entry: StorybookEntry) => {
    setLibrary((prev) => {
      const updated = [entry, ...prev];
      localStorage.setItem('nocomelon-library', JSON.stringify(updated));
      return updated;
    });
  };

  const removeStorybook = (id: string) => {
    setLibrary((prev) => prev.filter((item) => item.id !== id));
  };

  const getStorybook = (id: string) => {
    return library.find((item) => item.id === id);
  };

  return {
    library,
    addStorybook,
    removeStorybook,
    getStorybook
  };
}
