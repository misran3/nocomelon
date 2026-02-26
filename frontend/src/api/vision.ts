import { apiRequest } from './client';

export interface AsyncJobResponse {
  run_id: string;
  status: 'processing' | 'complete' | 'error';
  current_stage: string;
}

export async function analyzeDrawing(imageBase64: string, userId: string): Promise<AsyncJobResponse> {
  return apiRequest<AsyncJobResponse>('/api/v1/vision/analyze', {
    method: 'POST',
    body: JSON.stringify({
      image_base64: imageBase64,
      user_id: userId,
    }),
  });
}
