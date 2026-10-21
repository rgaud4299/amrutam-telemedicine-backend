import crypto from "crypto";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";

dotenv.config();

// -----------------------------------------------------------------------------
// AWS S3 Configuration
// -----------------------------------------------------------------------------

export const AWS_REGION = process.env.AWS_REGION || "us-east-1";
export const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET || process.env.AWS_BUCKET_NAME || process.env.S3_BUCKET || "";

const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY || "";
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY || "";

export const isS3Configured = Boolean(accessKeyId && secretAccessKey && AWS_S3_BUCKET);


export const s3Client = new S3Client({region: AWS_REGION,
  ...(process.env.AWS_ENDPOINT ? { endpoint: process.env.AWS_ENDPOINT } : {}),
  credentials: isS3Configured
    ? {
        accessKeyId,
        secretAccessKey,
      }
    : undefined,
});

// Backward-compatible alias
export const s3 = s3Client;

export type StandardFolder =
  | "licenses"
  | "profiles"
  | "avatars"
  | "signatures"
  | "prescriptions"
  | "documents"
  | "general"
  | string;

export interface S3UploadOptions {
  file: Express.Multer.File;
  folder?: StandardFolder;
  key?: string | number;
  customFileName?: string;
}

export interface S3UploadResult {
  url: string;
  storageType: "S3_CLOUD" | "LOCAL";
  key: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export function buildS3Url(bucket: string, region: string, key: string): string {
  const cdnBase = (
    process.env.AWS_CLOUDFRONT_URL ||
    process.env.CLOUDFRONT_URL ||
    process.env.CDN_URL ||
    ""
  ).replace(/\/+$/, "");

  if (cdnBase) {
    return `${cdnBase}/${key}`;
  }

  if (region === "us-east-1") {
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export async function uploadToS3(
  fileOrOptions: Express.Multer.File | S3UploadOptions,
  folderPath: StandardFolder = "general",
  key?: string | number,
  customFileName?: string,
): Promise<any> {
  
  const isOptionsObject = fileOrOptions && typeof fileOrOptions === "object" && "file" in fileOrOptions && Boolean((fileOrOptions as S3UploadOptions).file);

  const options: S3UploadOptions = isOptionsObject ? (fileOrOptions as S3UploadOptions): { file: fileOrOptions as Express.Multer.File, folder: folderPath, key, customFileName, };

  const { file, folder = "general", key: itemKey, customFileName: customName } = options;

  const ext = path.extname(file.originalname) || "";
  const uniqueId = `${Date.now()}-${crypto.randomUUID()}`;
  const fileName =
    customName ||
    (itemKey ? `${itemKey}-${uniqueId}${ext}` : `${uniqueId}${ext}`);

  const cleanFolder = folder.replace(/^\/+|\/+$/g, "").trim();
  const s3Key = cleanFolder ? `${cleanFolder}/${fileName}` : fileName;

  // 1. If S3 credentials and bucket are configured, try AWS S3 upload
  if (isS3Configured) {
    try {
      let fileBody: Buffer | fs.ReadStream;
      if (file.buffer) {
        fileBody = file.buffer;
      } else if (file.path && fs.existsSync(file.path)) {
        fileBody = fs.createReadStream(file.path);
      } else {
        throw new Error("File content is undefined. Multer storage is not properly configured.");
      }

      await s3Client.send(
        new PutObjectCommand({
          Bucket: AWS_S3_BUCKET,
          Key: s3Key,
          Body: fileBody,
          ContentType: file.mimetype || "application/octet-stream",
          CacheControl: "public, max-age=31536000, immutable",
        }),
      );

      // Cleanup local temp file if exists
      if (file.path && fs.existsSync(file.path)) {
        await fsPromises.unlink(file.path).catch(() => {});
      }

      const publicUrl = buildS3Url(AWS_S3_BUCKET, AWS_REGION, s3Key);

      const result: S3UploadResult = {
        url: publicUrl,
        storageType: "S3_CLOUD",
        key: s3Key,
        fileName,
        fileSize: file.size || 0,
        mimeType: file.mimetype || "application/octet-stream",
      };

      return isOptionsObject ? result : result.url;
    } catch (error) {
      console.warn("AWS S3 upload failed, falling back to local file storage:", error);
    }
  }

  // 2. Local fallback storage (/uploads/{cleanFolder}/{fileName})
  const uploadsDir = path.join(process.cwd(), "uploads", cleanFolder);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const localFilePath = path.join(uploadsDir, fileName);

  if (file.buffer) {
    await fsPromises.writeFile(localFilePath, file.buffer);
  } else if (file.path && fs.existsSync(file.path)) {
    fs.copyFileSync(file.path, localFilePath);
    await fsPromises.unlink(file.path).catch(() => {});
  }

  const serverUrl = (process.env.SERVER_URL || "http://localhost:9000").replace(/\/+$/, "");
  const localUrl = `${serverUrl}/uploads/${s3Key}`;

  const result: S3UploadResult = {
    url: localUrl,
    storageType: "LOCAL",
    key: s3Key,
    fileName,
    fileSize: file.size || 0,
    mimeType: file.mimetype || "application/octet-stream",
  };

  return isOptionsObject ? result : result.url;
}

