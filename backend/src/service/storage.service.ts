import { uploadToS3, S3UploadResult } from "../storage/uploadToS3";

export interface UploadFileOptions {
  file: Express.Multer.File;
  folder?: string;
  allowedExtensions?: string[];
}

export type UploadResult = S3UploadResult;

/**
 * Upload file to AWS S3 if configured, otherwise save to local /uploads directory
 */
export async function uploadFile(options: UploadFileOptions): Promise<UploadResult> {
  return uploadToS3({
    file: options.file,
    folder: options.folder,
  });
}

export default uploadFile;
