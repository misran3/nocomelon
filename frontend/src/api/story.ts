import { apiRequest } from './client';
import { DrawingAnalysis, StoryScript, Theme, VoiceType } from '../types';

export interface StoryRequest {
  drawing: DrawingAnalysis;
  theme: Theme;
  voice_type: VoiceType;
  child_age: number;
  personal_context?: string;
  user_id?: string;
  run_id?: string;
}

export async function generateStory(request: StoryRequest): Promise<StoryScript> {
  return apiRequest<StoryScript>('/api/v1/story/generate', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
