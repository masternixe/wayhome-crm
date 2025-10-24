import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { CacheService } from './cache.service';

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill';
}

export interface ImageVariant {
  size: string;
  width: number;
  height?: number;
  quality?: number;
}

export class ImageService {
  private uploadDir: string;
  private cacheService: CacheService;
  
  // Define standard image variants for optimization
  private readonly variants: Record<string, ImageVariant> = {
    thumbnail: { size: 'thumbnail', width: 150, height: 150, quality: 80 },
    small: { size: 'small', width: 300, height: 200, quality: 85 },
    medium: { size: 'medium', width: 600, height: 400, quality: 85 },
    large: { size: 'large', width: 1200, height: 800, quality: 90 },
    hero: { size: 'hero', width: 1920, height: 1080, quality: 90 },
  };

  constructor(uploadDir: string, cacheService: CacheService) {
    this.uploadDir = uploadDir;
    this.cacheService = cacheService;
  }

  /**
   * Process and optimize uploaded image
   */
  async processImage(
    inputPath: string,
    outputDir: string,
    filename: string,
    options: ImageProcessingOptions = {}
  ): Promise<string> {
    try {
      const {
        width,
        height,
        quality = 85,
        format = 'webp',
        fit = 'cover'
      } = options;

      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      // Generate output filename with format extension
      const ext = format === 'jpeg' ? 'jpg' : format;
      const outputFilename = `${path.parse(filename).name}.${ext}`;
      const outputPath = path.join(outputDir, outputFilename);

      // Process image with Sharp
      let pipeline = sharp(inputPath);

      // Resize if dimensions provided
      if (width || height) {
        pipeline = pipeline.resize(width, height, { 
          fit: fit as any,
          withoutEnlargement: true 
        });
      }

      // Apply format and quality
      switch (format) {
        case 'webp':
          pipeline = pipeline.webp({ quality });
          break;
        case 'jpeg':
          pipeline = pipeline.jpeg({ quality, progressive: true });
          break;
        case 'png':
          pipeline = pipeline.png({ quality, progressive: true });
          break;
      }

      // Save processed image
      await pipeline.toFile(outputPath);

      return outputFilename;
    } catch (error) {
      console.error('Image processing error:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Generate multiple variants of an image
   */
  async generateVariants(
    inputPath: string,
    originalFilename: string,
    baseUrl: string
  ): Promise<Record<string, string>> {
    const variants: Record<string, string> = {};
    const baseName = path.parse(originalFilename).name;
    const variantDir = path.join(this.uploadDir, 'variants');

    try {
      for (const [variantName, config] of Object.entries(this.variants)) {
        const variantFilename = await this.processImage(
          inputPath,
          variantDir,
          `${baseName}_${variantName}`,
          {
            width: config.width,
            height: config.height,
            quality: config.quality,
            format: 'webp'
          }
        );

        variants[variantName] = `${baseUrl}/api/v1/uploads/variants/${variantFilename}`;
      }

      // Cache the variants mapping
      await this.cacheService.set(
        `image_variants:${baseName}`,
        variants,
        { ttl: 86400 } // 24 hours
      );

      return variants;
    } catch (error) {
      console.error('Variant generation error:', error);
      throw new Error('Failed to generate image variants');
    }
  }

  /**
   * Get cached image variants
   */
  async getCachedVariants(filename: string): Promise<Record<string, string> | null> {
    const baseName = path.parse(filename).name;
    return await this.cacheService.get(`image_variants:${baseName}`);
  }

  /**
   * Optimize existing image in place
   */
  async optimizeImage(imagePath: string, options: ImageProcessingOptions = {}): Promise<void> {
    try {
      const {
        quality = 85,
        format = 'webp'
      } = options;

      const tempPath = `${imagePath}.temp`;
      
      let pipeline = sharp(imagePath);

      // Apply format and quality
      switch (format) {
        case 'webp':
          pipeline = pipeline.webp({ quality });
          break;
        case 'jpeg':
          pipeline = pipeline.jpeg({ quality, progressive: true });
          break;
        case 'png':
          pipeline = pipeline.png({ quality, progressive: true });
          break;
      }

      // Save to temp file first
      await pipeline.toFile(tempPath);

      // Replace original with optimized version
      await fs.rename(tempPath, imagePath);
    } catch (error) {
      console.error('Image optimization error:', error);
      // Clean up temp file if it exists
      try {
        await fs.unlink(`${imagePath}.temp`);
      } catch {}
      throw new Error('Failed to optimize image');
    }
  }

  /**
   * Get image metadata
   */
  async getImageMetadata(imagePath: string) {
    try {
      const metadata = await sharp(imagePath).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        hasAlpha: metadata.hasAlpha,
        density: metadata.density
      };
    } catch (error) {
      console.error('Failed to get image metadata:', error);
      return null;
    }
  }

  /**
   * Resize image to specific dimensions
   */
  async resizeImage(
    inputPath: string,
    outputPath: string,
    width: number,
    height?: number,
    options: { quality?: number; format?: 'webp' | 'jpeg' | 'png'; fit?: 'cover' | 'contain' } = {}
  ): Promise<void> {
    const { quality = 85, format = 'webp', fit = 'cover' } = options;

    let pipeline = sharp(inputPath)
      .resize(width, height, { 
        fit: fit as any,
        withoutEnlargement: true 
      });

    switch (format) {
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, progressive: true });
        break;
      case 'png':
        pipeline = pipeline.png({ quality, progressive: true });
        break;
    }

    await pipeline.toFile(outputPath);
  }

  /**
   * Convert image format
   */
  async convertFormat(
    inputPath: string,
    outputPath: string,
    format: 'webp' | 'jpeg' | 'png',
    quality: number = 85
  ): Promise<void> {
    let pipeline = sharp(inputPath);

    switch (format) {
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, progressive: true });
        break;
      case 'png':
        pipeline = pipeline.png({ quality, progressive: true });
        break;
    }

    await pipeline.toFile(outputPath);
  }

  /**
   * Generate responsive image srcset
   */
  generateSrcSet(variants: Record<string, string>): string {
    const srcSetEntries: string[] = [];

    // Map variants to their typical display widths
    const widthMap = {
      thumbnail: '150w',
      small: '300w',
      medium: '600w',
      large: '1200w',
      hero: '1920w'
    };

    for (const [variantName, url] of Object.entries(variants)) {
      if (widthMap[variantName as keyof typeof widthMap]) {
        srcSetEntries.push(`${url} ${widthMap[variantName as keyof typeof widthMap]}`);
      }
    }

    return srcSetEntries.join(', ');
  }

  /**
   * Clean up old image variants
   */
  async cleanupVariants(filename: string): Promise<void> {
    try {
      const baseName = path.parse(filename).name;
      const variantDir = path.join(this.uploadDir, 'variants');

      for (const variantName of Object.keys(this.variants)) {
        const variantPath = path.join(variantDir, `${baseName}_${variantName}.webp`);
        try {
          await fs.unlink(variantPath);
        } catch {
          // File might not exist, ignore
        }
      }

      // Remove from cache
      await this.cacheService.del(`image_variants:${baseName}`);
    } catch (error) {
      console.error('Cleanup variants error:', error);
    }
  }

  /**
   * Batch process images
   */
  async batchProcessImages(
    imagePaths: string[],
    outputDir: string,
    options: ImageProcessingOptions = {}
  ): Promise<string[]> {
    const results: string[] = [];

    for (const imagePath of imagePaths) {
      try {
        const filename = path.basename(imagePath);
        const processedFilename = await this.processImage(
          imagePath,
          outputDir,
          filename,
          options
        );
        results.push(processedFilename);
      } catch (error) {
        console.error(`Failed to process ${imagePath}:`, error);
        results.push(path.basename(imagePath)); // Keep original filename
      }
    }

    return results;
  }
}
