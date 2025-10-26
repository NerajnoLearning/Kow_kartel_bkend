import multer from 'multer';
import { Request } from 'express';
import { ValidationError } from '../utils/errorHandler';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Configure multer to store files in memory
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  callback: multer.FileFilterCallback
) => {
  // Check MIME type
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new ValidationError(
        `Invalid file type: ${file.mimetype}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
      )
    );
  }
};

// Create multer instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // Maximum 10 files per request
  },
});

// Middleware for single file upload
export const uploadSingle = upload.single('image');

// Middleware for multiple file upload (up to 10 files)
export const uploadMultiple = upload.array('images', 10);

// Middleware for mixed fields
export const uploadFields = upload.fields([
  { name: 'thumbnail', maxCount: 1 },
  { name: 'images', maxCount: 10 },
]);

// Error handler for multer errors
export const handleMulterError = (error: any, _req: Request, _res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return next(new ValidationError('File size exceeds 5MB limit'));
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return next(new ValidationError('Too many files. Maximum 10 files allowed'));
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return next(new ValidationError('Unexpected file field'));
    }
    return next(new ValidationError(`Upload error: ${error.message}`));
  }
  next(error);
};
