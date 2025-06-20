import { TRPCError } from '@trpc/server';
import crypto from 'crypto';
import type { FileUploadOptions, UploadedFile } from '../types';

// Default upload options
const DEFAULT_OPTIONS: FileUploadOptions = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: [
    'text/plain',
    'text/html',
    'text/css',
    'text/javascript',
    'application/javascript',
    'application/json',
    'application/xml',
    'text/xml',
    'text/markdown',
    'text/x-python',
    'text/x-java-source',
    'text/x-c',
    'text/x-c++',
    'text/x-csharp',
    'text/x-ruby',
    'text/x-go',
    'text/x-rust',
    'application/pdf',
  ],
  storage: 'local',
};

/**
 * Validate file upload
 */
export function validateFile(
  file: File,
  options: Partial<FileUploadOptions> = {}
): void {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Check file size
  if (file.size > opts.maxSize) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `File size exceeds limit of ${opts.maxSize / 1024 / 1024}MB`,
    });
  }
  
  // Check file type
  if (!opts.allowedTypes.includes(file.type)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `File type ${file.type} is not allowed`,
    });
  }
  
  // Additional security checks
  const filename = file.name.toLowerCase();
  const dangerousExtensions = ['.exe', '.bat', '.sh', '.ps1', '.dll', '.so'];
  
  if (dangerousExtensions.some(ext => filename.endsWith(ext))) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'File type not allowed for security reasons',
    });
  }
}

/**
 * Calculate file checksum
 */
export async function calculateChecksum(buffer: ArrayBuffer): Promise<string> {
  const hash = crypto.createHash('sha256');
  hash.update(Buffer.from(buffer));
  return hash.digest('hex');
}

/**
 * Handle file upload
 */
export async function handleFileUpload(
  file: File,
  options: Partial<FileUploadOptions> = {}
): Promise<UploadedFile> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Validate file
  validateFile(file, opts);
  
  // Read file content
  const buffer = await file.arrayBuffer();
  const checksum = await calculateChecksum(buffer);
  
  // Generate storage path
  const ext = file.name.split('.').pop() || 'txt';
  const filename = `${crypto.randomUUID()}.${ext}`;
  const storagePath = `uploads/${new Date().toISOString().split('T')[0]}/${filename}`;
  
  // Store file based on storage type
  if (opts.storage === 'local') {
    // In production, save to local filesystem
    // For now, we'll just simulate it
    console.log('Storing file locally:', storagePath);
  } else if (opts.storage === 's3') {
    // In production, upload to S3
    // For now, we'll just simulate it
    console.log('Uploading to S3:', storagePath);
  }
  
  return {
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    path: storagePath,
    checksum,
  };
}

/**
 * Delete uploaded file
 */
export async function deleteFile(path: string): Promise<void> {
  // In production, delete from storage
  console.log('Deleting file:', path);
}

/**
 * Get file URL for download
 */
export function getFileUrl(path: string): string {
  // In production, generate signed URL for S3 or return local file URL
  return `/api/files/${path}`;
}