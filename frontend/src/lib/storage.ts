import { getUrl } from 'aws-amplify/storage';

export async function getS3Url(key: string): Promise<string> {
  const { url } = await getUrl({ key });
  return url.toString();
}
