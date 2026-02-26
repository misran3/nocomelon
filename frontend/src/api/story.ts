import { apiRequest } from './client';
import { DrawingAnalysis, Theme, VoiceType } from '../types';

export interface StoryRequest {
  drawing: DrawingAnalysis;
  theme: Theme;
  voice_type: VoiceType;
  child_age: number;
  personal_context?: string;
  user_id: string;
  run_id: string;
}

export interface AsyncJobResponse {
  run_id: string;
  status: 'processing' | 'complete' | 'error';
  current_stage: string;
}

export async function generateStory(request: StoryRequest): Promise<AsyncJobResponse> {
  return apiRequest<AsyncJobResponse>('/api/v1/story/generate', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
