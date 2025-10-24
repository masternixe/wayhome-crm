import { Request, Response } from 'express';
import { PrismaClient } from '@wayhome/database';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  homepageBackgroundImage: z.string().url().optional(),
  siteName: z.string().optional(),
  siteDescription: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  facebookUrl: z.string().url().optional(),
  instagramUrl: z.string().url().optional(),
});

export class SettingsController {
  constructor(private prisma: PrismaClient) {}

  async getSettings(req: Request, res: Response) {
    try {
      // Get all settings from database
      const settings = await this.prisma.setting.findMany();
      
      // Convert to key-value object
      const settingsObj = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, string>);

      res.json({
        success: true,
        data: settingsObj,
      });
    } catch (error) {
      console.error('Failed to get settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get settings',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateSettings(req: Request, res: Response) {
    try {
      const { user } = req as any;

      // Only super admins can update settings
      if (user.role !== 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Access denied - only super admins can update settings',
        });
        return;
      }

      const validation = updateSettingsSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid input',
          errors: validation.error.errors,
        });
        return;
      }

      const data = validation.data;

      // Update each setting
      const updatedSettings = [];
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          const setting = await this.prisma.setting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
          });
          updatedSettings.push(setting);
        }
      }

      res.json({
        success: true,
        message: 'Settings updated successfully',
        data: updatedSettings,
      });
    } catch (error) {
      console.error('Failed to update settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update settings',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async uploadBackgroundImage(req: Request, res: Response) {
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
      console.error('Failed to upload background image:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload background image',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getExchangeRates(req: Request, res: Response) {
    try {
      // Get exchange rates from system settings
      const eurToAllSetting = await this.prisma.systemSettings.findUnique({
        where: { key: 'EUR_TO_ALL_RATE' }
      });
      const allToEurSetting = await this.prisma.systemSettings.findUnique({
        where: { key: 'ALL_TO_EUR_RATE' }
      });

      const exchangeRates = {
        eurToAll: eurToAllSetting ? parseFloat(String(eurToAllSetting.value)) : 97.3,
        allToEur: allToEurSetting ? parseFloat(String(allToEurSetting.value)) : 1/97.3,
      };

      res.json({
        success: true,
        data: exchangeRates,
      });
    } catch (error) {
      console.error('Failed to get exchange rates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get exchange rates',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getSystemSettings(req: Request, res: Response) {
    try {
      // Get all system settings from database
      const settings = await this.prisma.systemSettings.findMany();
      
      // Convert to key-value object with proper types
      const settingsObj = settings.reduce((acc, setting) => {
        acc[setting.key] = parseFloat(String(setting.value));
        return acc;
      }, {} as Record<string, number>);

      res.json({
        success: true,
        data: settingsObj,
      });
    } catch (error) {
      console.error('Failed to get system settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system settings',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateSystemSettings(req: Request, res: Response) {
    try {
      const { user } = req as any;

      // Only super admins can update system settings
      if (user.role !== 'SUPER_ADMIN') {
        res.status(403).json({
          success: false,
          message: 'Access denied - only super admins can update system settings',
        });
        return;
      }

      const updates = req.body;

      // Update each setting
      for (const [key, value] of Object.entries(updates)) {
        await this.prisma.systemSettings.upsert({
          where: { key },
          update: { 
            value: value as number,
            lastUpdatedBy: user.userId
          },
          create: { 
            key,
            value: value as number,
            lastUpdatedBy: user.userId
          }
        });
      }

      res.json({
        success: true,
        message: 'System settings updated successfully',
      });
    } catch (error) {
      console.error('Failed to update system settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update system settings',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}