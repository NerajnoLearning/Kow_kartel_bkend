import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';
import logger from '../config/logger';
import { ExternalServiceError, ValidationError } from './errorHandler';
import crypto from 'crypto';
import path from 'path';

// Initialize S3 client
const s3Client = new S3Client({
  region: env.AWS_REGION || 'us-east-1',
  credentials: env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

const BUCKET_NAME = env.S3_BUCKET_NAME || '';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export interface UploadFileOptions {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  folder?: string;
}

export class S3Service {
  /**
   * Upload a file to S3
   */
  async uploadFile(options: UploadFileOptions): Promise<string> {
    const { buffer, originalname, mimetype, folder = 'equipment' } = options;

    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      throw new ValidationError('File size exceeds 5MB limit');
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
      throw new ValidationError(
        `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
      );
    }

    // Generate unique filename
    const fileExtension = path.extname(originalname);
    const fileName = `${folder}/${crypto.randomBytes(16).toString('hex')}${fileExtension}`;

    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: buffer,
        ContentType: mimetype,
        ACL: 'public-read',
      });

      await s3Client.send(command);

      // Construct public URL
      const fileUrl = `https://${BUCKET_NAME}.s3.${env.AWS_REGION}.amazonaws.com/${fileName}`;

      logger.info(`File uploaded successfully: ${fileUrl}`);
      return fileUrl;
    } catch (error) {
      logger.error('S3 upload error:', error);
      throw new ExternalServiceError('Failed to upload file to S3', error);
    }
  }

  /**
   * Upload multiple files to S3
   */
  async uploadMultipleFiles(
    files: Array<{ buffer: Buffer; originalname: string; mimetype: string }>,
    folder?: string
  ): Promise<string[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile({
        buffer: file.buffer,
        originalname: file.originalname,
        mimetype: file.mimetype,
        folder,
      })
    );

    return await Promise.all(uploadPromises);
  }

  /**
   * Delete a file from S3
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract key from URL
      const urlParts = fileUrl.split('.com/');
      if (urlParts.length !== 2) {
        throw new ValidationError('Invalid S3 file URL');
      }

      const key = urlParts[1];

      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      logger.info(`File deleted successfully: ${fileUrl}`);
    } catch (error) {
      logger.error('S3 delete error:', error);
      throw new ExternalServiceError('Failed to delete file from S3', error);
    }
  }

  /**
   * Delete multiple files from S3
   */
  async deleteMultipleFiles(fileUrls: string[]): Promise<void> {
    const deletePromises = fileUrls.map((url) => this.deleteFile(url));
    await Promise.all(deletePromises);
  }

  /**
   * Generate a presigned URL for temporary access
   */
  async getPresignedUrl(fileKey: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
      });

      const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
      return presignedUrl;
    } catch (error) {
      logger.error('S3 presigned URL error:', error);
      throw new ExternalServiceError('Failed to generate presigned URL', error);
    }
  }

  /**
   * Check if S3 is configured
   */
  isConfigured(): boolean {
    return !!(
      env.AWS_ACCESS_KEY_ID &&
      env.AWS_SECRET_ACCESS_KEY &&
      env.AWS_REGION &&
      BUCKET_NAME
    );
  }
}

export default new S3Service();
