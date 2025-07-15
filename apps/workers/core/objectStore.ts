import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs/promises';
import path from 'path';
import { log } from './logger.js';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'dealbrief-scanner-artifacts';

/**
 * Upload a file to S3-compatible storage
 * @param localPath Local file path to upload
 * @param key S3 object key
 * @param mimeType MIME type of the file
 * @returns Public URL or signed URL of the uploaded file
 */
export async function uploadFile(localPath: string, key: string, mimeType: string): Promise<string> {
  try {
    // Read the file from local path
    const fileBuffer = await fs.readFile(localPath);
    
    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
      // Set metadata for security tracking
      Metadata: {
        'uploaded-by': 'dealbrief-scanner',
        'upload-timestamp': new Date().toISOString(),
      },
    });

    await s3Client.send(command);
    
    // Return the S3 URL
    const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
    
    log(`[objectStore] File uploaded successfully: ${key}`);
    return url;
    
  } catch (error) {
    log(`[objectStore] Failed to upload file ${localPath}:`, (error as Error).message);
    
    // For development/testing, return a placeholder URL if S3 is not configured
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      log(`[objectStore] S3 not configured, returning placeholder URL for ${key}`);
      return `placeholder://storage/${key}`;
    }
    
    throw error;
  }
}

/**
 * Generate a signed URL for downloading a file from S3
 * @param key S3 object key
 * @param expiresIn Expiration time in seconds (default: 1 hour)
 * @returns Signed URL for downloading the file
 */
export async function getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
    
  } catch (error) {
    log(`[objectStore] Failed to generate download URL for ${key}:`, (error as Error).message);
    throw error;
  }
}

/**
 * Check if S3 is properly configured
 * @returns boolean indicating if S3 is configured
 */
export function isS3Configured(): boolean {
  return !!(process.env.AWS_ACCESS_KEY_ID && 
           process.env.AWS_SECRET_ACCESS_KEY && 
           process.env.S3_BUCKET_NAME);
} 