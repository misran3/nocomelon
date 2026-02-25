import { apiRequest } from './client';
import { DrawingAnalysis } from '../types';

export interface VisionResponse {
  run_id: string;
  drawing: DrawingAnalysis;
}

export async function analyzeDrawing(imageBase64: string, userId?: string): Promise<VisionResponse> {
  return apiRequest<VisionResponse>('/api/v1/vision/analyze', {
    method: 'POST',
    body: JSON.stringify({
      image_base64: imageBase64,
      user_id: userId,
    }),
  });
}
