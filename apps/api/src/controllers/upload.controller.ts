import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@wayhome/database';
import { ImageService } from '../services/image.service';
import { CacheService } from '../services/cache.service';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import fssync from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // Determine upload directory based on file type
    const isImage = file.mimetype.startsWith('image/');
    const subDir = isImage ? 'images' : 'documents';
    const uploadDir = path.join(process.cwd(), 'uploads', subDir);
    
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
  private imageService: ImageService;
  
  constructor(
    private prisma: PrismaClient, 
    private cacheService: CacheService
  ) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'images');
    this.imageService = new ImageService(uploadDir, cacheService);
  }
  
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
        // Ensure HTTPS and use domain instead of IP for production
        let secureBaseUrl = baseUrl.replace(/^http:/, 'https:');
        // Replace IP address with domain for production
        if (secureBaseUrl.includes('103.86.176.122')) {
          secureBaseUrl = 'https://wayhome.al';
        }
        const fileUrl = `${secureBaseUrl}/api/v1/uploads/documents/${file.filename}`;

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
   * Upload single client document
   * POST /api/v1/upload/client-document
   */
  uploadClientDocument = [
    upload.single('file'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const authReq = req as AuthRequest;
        const file = req.file;
        const { clientId } = req.body as { clientId?: string };

        if (!file) {
          res.status(400).json({ success: false, message: 'No file uploaded' });
          return;
        }
        if (!clientId) {
          res.status(400).json({ success: false, message: 'clientId is required' });
          return;
        }

        // Move file into client-specific folder: uploads/documents/clients/:clientId
        const baseDir = path.join(process.cwd(), 'uploads', 'documents');
        const clientDir = path.join(baseDir, 'clients', clientId);
        await fs.mkdir(clientDir, { recursive: true });

        const tmpPath = path.join(baseDir, file.filename);
        const finalPath = path.join(clientDir, file.filename);
        try {
          await fs.rename(tmpPath, finalPath);
        } catch (err) {
          // In case file was already in place (e.g., different storage behavior), copy as fallback
          if (fssync.existsSync(tmpPath)) {
            await fs.copyFile(tmpPath, finalPath).catch(() => undefined);
            await fs.unlink(tmpPath).catch(() => undefined);
          }
        }

        const baseUrl = process.env.API_URL || 'http://localhost:4001';
        const fileUrl = `${baseUrl}/api/v1/uploads/documents/clients/${clientId}/${file.filename}`;

        res.json({
          success: true,
          data: {
            id: file.filename,
            url: fileUrl,
            originalName: file.originalname,
            size: file.size,
            type: file.mimetype,
            uploadedBy: authReq.user.userId,
            uploadedAt: new Date().toISOString(),
          },
          message: 'Client document uploaded successfully',
        });
      } catch (error) {
        console.error('Client document upload error:', error);
        res.status(500).json({ success: false, message: 'Failed to upload client document' });
      }
    }
  ];

  /**
   * Upload multiple client documents
   * POST /api/v1/upload/client-documents
   */
  uploadClientDocuments = [
    upload.array('files'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const authReq = req as AuthRequest;
        const files = (req as any).files as Express.Multer.File[] | undefined;
        const { clientId } = req.body as { clientId?: string };

        if (!files || files.length === 0) {
          res.status(400).json({ success: false, message: 'No files uploaded' });
          return;
        }
        if (!clientId) {
          res.status(400).json({ success: false, message: 'clientId is required' });
          return;
        }

        const baseDir = path.join(process.cwd(), 'uploads', 'documents');
        const clientDir = path.join(baseDir, 'clients', clientId);
        await fs.mkdir(clientDir, { recursive: true });

        const baseUrl = process.env.API_URL || 'http://localhost:4001';
        const results: any[] = [];

        for (const file of files) {
          const tmpPath = path.join(baseDir, file.filename);
          const finalPath = path.join(clientDir, file.filename);
          try {
            await fs.rename(tmpPath, finalPath);
          } catch (err) {
            if (fssync.existsSync(tmpPath)) {
              await fs.copyFile(tmpPath, finalPath).catch(() => undefined);
              await fs.unlink(tmpPath).catch(() => undefined);
            }
          }

          results.push({
            id: file.filename,
            url: `${secureBaseUrl}/api/v1/uploads/documents/clients/${clientId}/${file.filename}`,
            originalName: file.originalname,
            size: file.size,
            type: file.mimetype,
            uploadedBy: authReq.user.userId,
            uploadedAt: new Date().toISOString(),
          });
        }

        res.json({ success: true, data: results, message: 'Client documents uploaded successfully' });
      } catch (error) {
        console.error('Client documents upload error:', error);
        res.status(500).json({ success: false, message: 'Failed to upload client documents' });
      }
    }
  ];

  /**
   * Delete single client document
   * DELETE /api/v1/upload/client-document/:clientId/:filename
   */
  deleteClientDocument = async (req: Request, res: Response): Promise<void> => {
    try {
      const { clientId, filename } = req.params as { clientId: string; filename: string };
      if (!clientId || !filename) {
        res.status(400).json({ success: false, message: 'clientId and filename are required' });
        return;
      }
      const filePath = path.join(process.cwd(), 'uploads', 'documents', 'clients', clientId, filename);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        if ((err as any).code === 'ENOENT') {
          res.status(404).json({ success: false, message: 'Document not found' });
          return;
        }
        throw err;
      }
      res.json({ success: true, message: 'Client document deleted successfully' });
    } catch (error) {
      console.error('Client document deletion error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete client document' });
    }
  };
  /**
   * Upload multiple documents
   * POST /api/v1/upload/documents
   */
  uploadDocuments = [
    upload.array('files'),
    async (req: Request, res: Response): Promise<void> => {
      try {
        const authReq = req as AuthRequest;
        const files = (req as any).files as Express.Multer.File[] | undefined;

        if (!files || files.length === 0) {
          res.status(400).json({
            success: false,
            message: 'No files uploaded',
          });
          return;
        }

        const baseUrl = process.env.API_URL || 'http://localhost:4001';
        const { propertyId } = req.body;

        // Persist property documents if a propertyId is provided
        const createdDocs = [] as Array<{ id: string, url: string, originalName: string, size: number, type: string, uploadedBy: string, uploadedAt: string }>;

        for (const file of files) {
          const fileUrl = `${baseUrl}/api/v1/uploads/${file.mimetype.startsWith('image/') ? 'images' : 'documents'}/${file.filename}`;

          if (propertyId) {
            try {
              const record = await this.prisma.propertyDocument.create({
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

              createdDocs.push({
                id: record.id,
                url: fileUrl,
                originalName: file.originalname,
                size: file.size,
                type: file.mimetype,
                uploadedBy: authReq.user.userId,
                uploadedAt: new Date().toISOString(),
              });
            } catch (err) {
              // If DB save fails for a file, still include it as a basic upload
              createdDocs.push({
                id: file.filename,
                url: fileUrl,
                originalName: file.originalname,
                size: file.size,
                type: file.mimetype,
                uploadedBy: authReq.user.userId,
                uploadedAt: new Date().toISOString(),
              });
            }
          } else {
            createdDocs.push({
              id: file.filename,
              url: fileUrl,
              originalName: file.originalname,
              size: file.size,
              type: file.mimetype,
              uploadedBy: authReq.user.userId,
              uploadedAt: new Date().toISOString(),
            });
          }
        }

        res.json({
          success: true,
          data: createdDocs,
          message: 'Files uploaded successfully',
        });
      } catch (error) {
        console.error('Multiple files upload error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to upload files',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  ];

  /**
   * Upload image
   * POST /api/v1/upload/image
   */
  uploadImage = [
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

        // Validate that it's an image
        if (!file.mimetype.startsWith('image/')) {
          res.status(400).json({
            success: false,
            message: 'File must be an image',
          });
          return;
        }

        // Generate public URL for the file
        const baseUrl = process.env.API_URL || 'http://localhost:4001';
        // Ensure HTTPS and use domain instead of IP for production
        let secureBaseUrl = baseUrl.replace(/^http:/, 'https:');
        // Replace IP address with domain for production
        if (secureBaseUrl.includes('103.86.176.122')) {
          secureBaseUrl = 'https://wayhome.al';
        }
        const fileUrl = `${secureBaseUrl}/api/v1/uploads/images/${file.filename}`;

        // Process and optimize the image
        try {
          const imagePath = path.join(process.cwd(), 'uploads', 'images', file.filename);
          
          // Generate optimized variants
          const variants = await this.imageService.generateVariants(
            imagePath,
            file.filename,
            secureBaseUrl
          );

          // Get image metadata
          const metadata = await this.imageService.getImageMetadata(imagePath);

          res.json({
            success: true,
            data: {
              id: file.filename,
              url: fileUrl,
              variants,
              metadata,
              originalName: file.originalname,
              size: file.size,
              type: file.mimetype,
              uploadedBy: authReq.user.userId,
              uploadedAt: new Date().toISOString(),
            },
            message: 'Image uploaded and optimized successfully',
          });
        } catch (optimizationError) {
          console.warn('Image optimization failed, returning original:', optimizationError);
          
          // Return original image if optimization fails
          res.json({
            success: true,
            data: {
              id: file.filename,
              url: fileUrl,
              originalName: file.originalname,
              size: file.size,
              type: file.mimetype,
              uploadedBy: authReq.user.userId,
              uploadedAt: new Date().toISOString(),
            },
            message: 'Image uploaded successfully',
          });
        }
      } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to upload image',
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

  uploadBackgroundImage = [
    upload.single('file'),
    async (req: Request, res: Response) => {
      try {
        const { user } = req as any;

        // Only super admins can upload background images
        if (user.role !== 'SUPER_ADMIN') {
          res.status(403).json({
            success: false,
            message: 'Access denied - only super admins can upload background images',
          });
          return;
        }

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
        // Ensure HTTPS and use domain instead of IP for production
        let secureBaseUrl = baseUrl.replace(/^http:/, 'https:');
        // Replace IP address with domain for production
        if (secureBaseUrl.includes('103.86.176.122')) {
          secureBaseUrl = 'https://wayhome.al';
        }
        const fileUrl = `${secureBaseUrl}/api/v1/uploads/images/${file.filename}`;

        // Save the background image URL to settings
        await this.prisma.setting.upsert({
          where: { key: 'homepageBackgroundImage' },
          update: { value: fileUrl },
          create: { key: 'homepageBackgroundImage', value: fileUrl },
        });

        res.json({
          success: true,
          message: 'Background image uploaded successfully',
          data: {
            url: fileUrl,
          },
        });
      } catch (error) {
        console.error('Background image upload error:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to upload background image',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  ];
}
