import { apiRequest } from './client';
import { DrawingAnalysis, StoryScript, Style, VoiceType } from '../types';

export interface PipelineRequest {
  run_id: string;
  story: StoryScript;
  drawing: DrawingAnalysis;
  style: Style;
  voice_type: VoiceType;
  user_id?: string;
}

export interface GeneratedImage {
  scene_number: number;
  key: string;
}

export interface VideoResult {
  video_key: string;
  duration_sec: number;
  thumbnail_key: string;
}

export interface PipelineResponse {
  video: VideoResult;
  images: GeneratedImage[];
}

export async function generateVideo(request: PipelineRequest): Promise<PipelineResponse> {
  return apiRequest<PipelineResponse>('/api/v1/pipeline/generate', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
