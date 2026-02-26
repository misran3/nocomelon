import { apiRequest } from './client';

interface PresignedUrlResponse {
  url: string;
  expires_in: number;
}

/**
 * Get a pre-signed URL for accessing an S3 object.
 * @param s3Key - The S3 key of the object
 * @param userId - The user ID for authorization
 */
export async function getPresignedUrl(
  s3Key: string,
  userId: string
): Promise<PresignedUrlResponse> {
  return apiRequest<PresignedUrlResponse>(
    `/api/v1/storage/presigned-url?user_id=${encodeURIComponent(userId)}`,
    {
      method: 'POST',
      body: JSON.stringify({ s3_key: s3Key }),
    }
  );
}
