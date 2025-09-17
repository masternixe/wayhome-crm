import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@wayhome/database';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    
    // Create directory if it doesn't exist
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, extension);
    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/webp',
      'text/plain'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

export class UploadController {
  constructor(private prisma: PrismaClient) {}
  
  /**
   * Upload document
   * POST /api/v1/upload/document
   */
  uploadDocument = [
    upload.single('file'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const authReq = req as AuthRequest;
        const file = req.file;

        if (!file) {
          res.status(400).json({
            success: false,
            message: 'No file uploaded',
          });
          return;
        }

        // Generate public URL for the file
        const baseUrl = process.env.API_URL || 'http://localhost:4001';
        const fileUrl = `${baseUrl}/api/v1/uploads/documents/${file.filename}`;

        // Check if this is for a property document
        const { propertyId } = req.body;

        let documentRecord = null;
        if (propertyId) {
          // Save property document to database
          documentRecord = await this.prisma.propertyDocument.create({
            data: {
              propertyId,
              name: file.originalname,
              url: fileUrl,
              mimeType: file.mimetype,
              size: file.size,
              showInFrontend: false,
              uploadedBy: authReq.user.userId,
            },
          });
        }

        res.json({
          success: true,
          data: {
            id: documentRecord?.id || file.filename,
            url: fileUrl,
            originalName: file.originalname,
            size: file.size,
            type: file.mimetype,
            uploadedBy: authReq.user.userId,
            uploadedAt: new Date().toISOString(),
          },
          message: 'File uploaded successfully',
        });
      } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to upload file',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  ];

  /**
   * Delete document
   * DELETE /api/v1/upload/document/:id
   */
  deleteDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const authReq = req as AuthRequest;

      // First try to find property document
      const propertyDoc = await this.prisma.propertyDocument.findUnique({
        where: { id },
      });

      if (propertyDoc) {
        // Delete from database
        await this.prisma.propertyDocument.delete({
          where: { id },
        });

        // Delete physical file
        const filename = path.basename(propertyDoc.url);
        const filePath = path.join(process.cwd(), 'uploads', 'documents', filename);
        
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.warn('File not found on disk:', filename);
        }

        res.json({
          success: true,
          message: 'Document deleted successfully',
        });
        return;
      }

      // Fallback to direct file deletion (for legacy uploads)
      const filePath = path.join(process.cwd(), 'uploads', 'documents', id);
      try {
        await fs.unlink(filePath);
        res.json({
          success: true,
          message: 'File deleted successfully',
        });
      } catch (error) {
        if ((error as any).code === 'ENOENT') {
          res.status(404).json({
            success: false,
            message: 'Document not found',
          });
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('File deletion error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete document',
      });
    }
  };

  /**
   * Update document visibility
   * PATCH /api/v1/upload/document/:id/visibility
   */
  updateDocumentVisibility = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { showInFrontend } = req.body;
      const authReq = req as AuthRequest;

      // Find and update the document
      const document = await this.prisma.propertyDocument.update({
        where: { id },
        data: { showInFrontend: Boolean(showInFrontend) },
      });

      res.json({
        success: true,
        data: document,
        message: 'Document visibility updated successfully',
      });
    } catch (error) {
      console.error('Document visibility update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update document visibility',
      });
    }
  };
}
