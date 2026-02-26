import { apiRequest } from './client';
import { Style } from '../types';

export interface LibraryEntry {
  id: string;
  title: string;
  thumbnail_key: string;
  video_key: string;
  duration_sec: number;
  style: Style;
  created_at: string;
}

export async function getLibrary(userId: string): Promise<LibraryEntry[]> {
  return apiRequest<LibraryEntry[]>(`/api/v1/library?user_id=${userId}`);
}

export async function saveToLibrary(entry: LibraryEntry, userId: string): Promise<LibraryEntry> {
  return apiRequest<LibraryEntry>(`/api/v1/library?user_id=${userId}`, {
    method: 'POST',
    body: JSON.stringify(entry),
  });
}

export async function deleteFromLibrary(id: string, userId: string): Promise<void> {
  await apiRequest(`/api/v1/library/${id}?user_id=${userId}`, {
    method: 'DELETE',
  });
}
