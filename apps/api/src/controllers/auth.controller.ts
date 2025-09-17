import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { EmailService } from '../workers/email.worker';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
  role: z.enum(['SUPER_ADMIN', 'OFFICE_ADMIN', 'MANAGER', 'AGENT']).optional(),
  officeId: z.string().optional(),
});

const publicRegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8),
});

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});

export class AuthController {
  constructor(
    private authService: AuthService,
    private emailService: EmailService | null
  ) {}

  /**
   * Register new CRM user
   * POST /api/v1/auth/register
   */
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = registerSchema.parse(req.body);
      
      const user = await this.authService.register(data);
      
      // Send welcome email (if service is available)
      if (this.emailService) {
        await this.emailService.sendWelcomeEmail(
          user.email,
          `${user.firstName} ${user.lastName}`,
          false
        );
      }
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
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
      
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      });
    }
  };

  /**
   * Register public user
   * POST /api/v1/auth/public/register
   */
  registerPublic = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = publicRegisterSchema.parse(req.body);
      
      const { user, verificationToken } = await this.authService.registerPublicUser(data);
      
      // Send verification email (if service is available)
      if (this.emailService) {
        await this.emailService.sendVerificationEmail(
          user.email,
          `${user.firstName} ${user.lastName}`,
          verificationToken
        );
      }
      
      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        data: {
          id: user.id,
          email: user.email,
          verified: user.verified,
        },
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
      
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      });
    }
  };

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = loginSchema.parse(req.body);
      
      const { user, tokens } = await this.authService.login(data);
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            officeId: user.officeId,
            avatar: user.avatar,
            points: user.points,
          },
          tokens,
        },
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
      
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      });
    }
  };

  /**
   * Login public user
   * POST /api/v1/auth/public/login
   */
  loginPublic = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = loginSchema.parse(req.body);
      
      const { user, tokens } = await this.authService.loginPublicUser(data);
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            verified: user.verified,
          },
          tokens,
        },
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
      
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      });
    }
  };

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  refresh = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);
      
      const tokens = await this.authService.refreshToken(refreshToken);
      
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: tokens,
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
      
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Token refresh failed',
      });
    }
  };

  /**
   * Verify email
   * POST /api/v1/auth/verify-email
   */
  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Verification token is required',
        });
        return;
      }
      
      await this.authService.verifyEmail(token);
      
      res.json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Email verification failed',
      });
    }
  };

  /**
   * Request password reset
   * POST /api/v1/auth/forgot-password
   */
  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, isPublicUser } = req.body;
      
      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required',
        });
        return;
      }
      
      const resetToken = await this.authService.requestPasswordReset(email, isPublicUser);
      
      // Send password reset email (if service is available)
      if (this.emailService) {
        await this.emailService.sendPasswordResetEmail(email, 'User', resetToken);
      }
      
      res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to process password reset request',
      });
    }
  };

  /**
   * Reset password
   * POST /api/v1/auth/reset-password
   */
  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, password, isPublicUser } = resetPasswordSchema
        .extend({ isPublicUser: z.boolean().optional() })
        .parse(req.body);
      
      await this.authService.resetPassword(token, password, isPublicUser);
      
      res.json({
        success: true,
        message: 'Password reset successfully',
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
      
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Password reset failed',
      });
    }
  };

  /**
   * Change password (authenticated)
   * POST /api/v1/auth/change-password
   */
  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
      const userId = (req as any).user.userId;
      
      await this.authService.changePassword(userId, currentPassword, newPassword);
      
      res.json({
        success: true,
        message: 'Password changed successfully',
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
      
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Password change failed',
      });
    }
  };

  /**
   * Get current user profile
   * GET /api/v1/auth/me
   */
  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user.userId;
      const userRole = (req as any).user.role;
      
      // Determine which table to query based on role
      if (userRole === 'PUBLIC_USER') {
        // Query public user table
        const user = await this.authService['prisma'].publicUser.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            verified: true,
            createdAt: true,
          },
        });
        
        res.json({
          success: true,
          data: user,
        });
      } else {
        // Query CRM user table
        const user = await this.authService['prisma'].user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            status: true,
            officeId: true,
            avatar: true,
            points: true,
            isAgentOfMonth: true,
            createdAt: true,
            office: {
              select: {
                id: true,
                name: true,
                city: true,
              },
            },
          },
        });
        
        res.json({
          success: true,
          data: user,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get user profile',
      });
    }
  };

  /**
   * Logout (invalidate token - in a full implementation you'd maintain a blacklist)
   * POST /api/v1/auth/logout
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      // In a full implementation, you'd add the token to a blacklist
      // For now, we'll just return success
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Logout failed',
      });
    }
  };
}
