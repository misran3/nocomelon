import { apiRequest } from './client';

export interface JobStatus {
  user_id: string;
  run_id: string;
  status: 'processing' | 'complete' | 'error';
  current_stage: string | null;
  error: string | null;
  drawing_analysis: Record<string, unknown> | null;
  story_script: Record<string, unknown> | null;
  images: Array<{ scene_number: number; key: string }> | null;
  video: Record<string, unknown> | null;
  updated_at: string | null;
}

export async function getJobStatus(runId: string, userId: string): Promise<JobStatus> {
  return apiRequest<JobStatus>(`/api/v1/jobs/${runId}/status?user_id=${userId}`);
}
