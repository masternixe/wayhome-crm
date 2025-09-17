import { Request, Response } from 'express';
import { PrismaClient, UserRole } from '@wayhome/database';
import { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  EUR_TO_ALL_RATE: z.number().min(50).max(150).optional(),
  ALL_TO_EUR_RATE: z.number().min(0.006).max(0.02).optional(),
  COMMISSION_SALE_RATE: z.number().min(0).max(0.1).optional(),
  COMMISSION_RENT_RATE: z.number().min(0).max(1).optional(),
  MAX_BIDDING_SLOTS: z.number().int().min(5).max(50).optional(),
  BIDDING_SLOT_DURATION_DAYS: z.number().int().min(7).max(90).optional(),
});

export class SettingsController {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get all system settings
   * GET /api/v1/settings
   */
  getSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      
      // Only allow admin users to view settings
      if (authReq.user.role === UserRole.AGENT) {
        res.status(403).json({
          success: false,
          message: 'Access denied: Admin privileges required',
        });
        return;
      }

      const settings = await this.prisma.systemSettings.findMany({
        select: {
          key: true,
          value: true,
          description: true,
        },
      });

      // Convert settings array to key-value object
      const settingsObject: Record<string, number> = {};
      settings.forEach(setting => {
        settingsObject[setting.key] = setting.value;
      });

      res.json({
        success: true,
        data: settingsObject,
      });
    } catch (error) {
      console.error('Failed to get settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve settings',
      });
    }
  };

  /**
   * Update system settings
   * PUT /api/v1/settings
   */
  updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const authReq = req as AuthRequest;
      
      // Only allow super admin to update settings
      if (authReq.user.role !== UserRole.SUPER_ADMIN) {
        res.status(403).json({
          success: false,
          message: 'Access denied: Super Admin privileges required',
        });
        return;
      }

      const validatedData = updateSettingsSchema.parse(req.body);

      // Update each setting that was provided
      const updatePromises = Object.entries(validatedData).map(([key, value]) => {
        if (value !== undefined) {
          return this.prisma.systemSettings.upsert({
            where: { key },
            update: { value },
            create: {
              key,
              value,
              description: this.getSettingDescription(key),
            },
          });
        }
      }).filter(Boolean);

      await Promise.all(updatePromises);

      // Fetch updated settings to return
      const updatedSettings = await this.prisma.systemSettings.findMany({
        select: {
          key: true,
          value: true,
          description: true,
        },
      });

      const settingsObject: Record<string, number> = {};
      updatedSettings.forEach(setting => {
        settingsObject[setting.key] = setting.value;
      });

      res.json({
        success: true,
        data: settingsObject,
        message: 'Settings updated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors,
        });
        return;
      }

      console.error('Failed to update settings:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update settings',
      });
    }
  };

  /**
   * Get current exchange rates for currency conversion
   * GET /api/v1/settings/exchange-rates
   */
  getExchangeRates = async (req: Request, res: Response): Promise<void> => {
    try {
      const rates = await this.prisma.systemSettings.findMany({
        where: {
          key: {
            in: ['EUR_TO_ALL_RATE', 'ALL_TO_EUR_RATE']
          }
        },
        select: {
          key: true,
          value: true,
        },
      });

      const exchangeRates: Record<string, number> = {};
      rates.forEach(rate => {
        exchangeRates[rate.key] = rate.value;
      });

      res.json({
        success: true,
        data: {
          eurToAll: exchangeRates.EUR_TO_ALL_RATE || 97.3,
          allToEur: exchangeRates.ALL_TO_EUR_RATE || (1/97.3),
        },
      });
    } catch (error) {
      console.error('Failed to get exchange rates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve exchange rates',
      });
    }
  };

  /**
   * Helper method to get default descriptions for settings
   */
  private getSettingDescription(key: string): string {
    const descriptions: Record<string, string> = {
      EUR_TO_ALL_RATE: 'Exchange rate from EUR to ALL',
      ALL_TO_EUR_RATE: 'Exchange rate from ALL to EUR',
      COMMISSION_SALE_RATE: 'Commission rate for property sales',
      COMMISSION_RENT_RATE: 'Commission rate for property rentals',
      BIDDING_SLOT_DURATION_DAYS: 'Default duration for promoted listing slots in days',
      MAX_BIDDING_SLOTS: 'Maximum number of featured property slots',
    };

    return descriptions[key] || 'System setting';
  }
}
