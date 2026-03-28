/**
 * Cloudflare R2 Storage Service
 * Handles upload/delete of files to R2 using S3-compatible API.
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { readSingleton } from '../store';
import type { AppSettings } from '../../src/types';

function getR2Client(): { client: S3Client; bucketName: string; publicUrl: string } {
  const settings = readSingleton<AppSettings>('settings', {} as AppSettings);
  const r2 = settings.r2;
  if (!r2?.accountId || !r2?.accessKeyId || !r2?.secretAccessKey || !r2?.bucketName) {
    throw new Error('Cloudflare R2 chưa được cấu hình. Vào Cài đặt → Cloudflare R2 để thiết lập.');
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${r2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: r2.accessKeyId,
      secretAccessKey: r2.secretAccessKey,
    },
  });

  return { client, bucketName: r2.bucketName, publicUrl: r2.publicUrl || '' };
}

export async function uploadToR2(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const { client, bucketName, publicUrl } = getR2Client();

  await client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  // Return public URL if configured, otherwise construct R2 URL
  if (publicUrl) {
    return `${publicUrl.replace(/\/$/, '')}/${key}`;
  }
  return `https://${bucketName}.r2.dev/${key}`;
}

export async function deleteFromR2(key: string): Promise<void> {
  const { client, bucketName } = getR2Client();

  await client.send(new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  }));
}
