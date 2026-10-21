import multer from "multer";
import path from "path";
import os from "os";
import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/appError";

const tempDir = os.tmpdir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, tempDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, true);
  },
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new AppError(400, "Only image files (JPEG, PNG, WEBP, GIF) are allowed.") as any);
    }
  },
});

export const uploadLicenseDoc = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB max
  fileFilter: (_req, file, cb) => {
    const isAllowed =
      file.mimetype === "application/pdf" ||
      file.mimetype.startsWith("image/") ||
      file.originalname.toLowerCase().endsWith(".pdf") ||
      file.originalname.toLowerCase().endsWith(".jpg") ||
      file.originalname.toLowerCase().endsWith(".png");

    if (!isAllowed) {
      return cb(new AppError(400, "Only PDF, JPG, or PNG files are allowed for license certificates.") as any);
    }
    cb(null, true);
  },
});

export const uploadLicenseCertificateMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const multerHandler = uploadLicenseDoc.any();
  multerHandler(req, res, (err: any) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new AppError(400, "File size exceeds the maximum limit of 15 MB."));
      }
      if (err instanceof AppError) {
        return next(err);
      }
      return next(new AppError(400, err.message || "File upload error"));
    }
    next();
  });
};

export const uploadImageMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const multerHandler = uploadImage.any();
  multerHandler(req, res, (err: any) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new AppError(400, "Image size exceeds the maximum limit of 10 MB."));
      }
      if (err instanceof AppError) {
        return next(err);
      }
      return next(new AppError(400, err.message || "Image upload error"));
    }
    next();
  });
};

export const uploadSignatureMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const multerHandler = upload.any();
  multerHandler(req, res, (err: any) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new AppError(400, "Signature file exceeds maximum limit."));
      }
      return next(new AppError(400, err.message || "Signature upload error"));
    }
    next();
  });
};
