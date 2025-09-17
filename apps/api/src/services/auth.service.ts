import { PrismaClient, User, UserRole, UserStatus } from '@wayhome/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { addDays, addMinutes } from 'date-fns';
import crypto from 'crypto';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  officeId?: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
  officeId?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface PublicRegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export class AuthService {
  private readonly ACCESS_TOKEN_EXPIRES_IN = '15m';
  private readonly REFRESH_TOKEN_EXPIRES_IN = '7d';
  private readonly PASSWORD_RESET_EXPIRES_IN = 60; // minutes
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 30; // minutes

  constructor(
    private prisma: PrismaClient,
    private jwtSecret: string,
    private jwtRefreshSecret: string
  ) {}

  /**
   * Register a new user (CRM users only)
   */
  async register(input: RegisterInput): Promise<User> {
    const { email, password, firstName, lastName, phone, role = UserRole.AGENT, officeId } = input;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Validate office if provided
    if (officeId) {
      const office = await this.prisma.office.findUnique({
        where: { id: officeId },
      });
      if (!office) {
        throw new Error('Invalid office ID');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        role,
        officeId,
        status: UserStatus.ACTIVE,
      },
    });

    // Log activity
    await this.logActivity(user.id, 'USER_REGISTERED');

    return user;
  }

  /**
   * Register a public user (for property listings)
   */
  async registerPublicUser(input: PublicRegisterInput): Promise<{ user: any; verificationToken: string }> {
    const { email, password, firstName, lastName, phone } = input;

    // Check if user already exists
    const existingUser = await this.prisma.publicUser.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');

    // Create public user
    const user = await this.prisma.publicUser.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phone,
        verified: false,
        verifyToken,
      },
    });

    return { user, verificationToken: verifyToken };
  }

  /**
   * Login user (CRM)
   */
  async login(input: LoginInput): Promise<{ user: User; tokens: AuthTokens }> {
    const { email, password } = input;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { office: true },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new Error('Account is not active');
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      // TODO: Implement login attempt tracking and account lockout
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      officeId: user.officeId || undefined,
    });

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log activity
    await this.logActivity(user.id, 'USER_LOGIN');

    return { user, tokens };
  }

  /**
   * Login public user
   */
  async loginPublicUser(input: LoginInput): Promise<{ user: any; tokens: AuthTokens }> {
    const { email, password } = input;

    // Find user
    const user = await this.prisma.publicUser.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is verified
    if (!user.verified) {
      throw new Error('Please verify your email before logging in');
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const tokens = this.generateTokens({
      userId: user.id,
      email: user.email,
      role: UserRole.PUBLIC_USER,
    });

    return { user, tokens };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = jwt.verify(refreshToken, this.jwtRefreshSecret) as JWTPayload;

      // Check if user still exists and is active
      if (payload.role === UserRole.PUBLIC_USER) {
        const user = await this.prisma.publicUser.findUnique({
          where: { id: payload.userId },
        });
        if (!user || !user.verified) {
          throw new Error('Invalid refresh token');
        }
      } else {
        const user = await this.prisma.user.findUnique({
          where: { id: payload.userId },
        });
        if (!user || user.status !== UserStatus.ACTIVE) {
          throw new Error('Invalid refresh token');
        }
      }

      // Generate new tokens
      return this.generateTokens(payload);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Verify email for public user
   */
  async verifyEmail(token: string): Promise<void> {
    const user = await this.prisma.publicUser.findFirst({
      where: { verifyToken: token },
    });

    if (!user) {
      throw new Error('Invalid verification token');
    }

    await this.prisma.publicUser.update({
      where: { id: user.id },
      data: {
        verified: true,
        verifyToken: null,
      },
    });
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string, isPublicUser: boolean = false): Promise<string> {
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = addMinutes(new Date(), this.PASSWORD_RESET_EXPIRES_IN);

    if (isPublicUser) {
      const user = await this.prisma.publicUser.findUnique({
        where: { email },
      });

      if (!user) {
        // Don't reveal if user exists
        return resetToken;
      }

      await this.prisma.publicUser.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetExpires,
        },
      });
    } else {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Don't reveal if user exists
        return resetToken;
      }

      // Store reset token in activity log for CRM users
      await this.logActivity(user.id, 'PASSWORD_RESET_REQUESTED', {
        resetToken,
        resetExpires,
      });
    }

    return resetToken;
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string, isPublicUser: boolean = false): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 12);

    if (isPublicUser) {
      const user = await this.prisma.publicUser.findFirst({
        where: {
          resetToken: token,
          resetExpires: { gt: new Date() },
        },
      });

      if (!user) {
        throw new Error('Invalid or expired reset token');
      }

      await this.prisma.publicUser.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetToken: null,
          resetExpires: null,
        },
      });
    } else {
      // For CRM users, find the reset token in activity logs
      const activity = await this.prisma.activityLog.findFirst({
        where: {
          action: 'PASSWORD_RESET_REQUESTED',
          metadata: {
            path: ['resetToken'],
            equals: token,
          },
          createdAt: { gt: addMinutes(new Date(), -this.PASSWORD_RESET_EXPIRES_IN) },
        },
      });

      if (!activity) {
        throw new Error('Invalid or expired reset token');
      }

      await this.prisma.user.update({
        where: { id: activity.userId },
        data: { passwordHash },
      });

      await this.logActivity(activity.userId, 'PASSWORD_RESET_COMPLETED');
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    await this.logActivity(userId, 'PASSWORD_CHANGED');
  }

  /**
   * Validate access token
   */
  async validateToken(token: string): Promise<JWTPayload> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as JWTPayload;
      return payload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Generate JWT tokens
   */
  private generateTokens(payload: JWTPayload): AuthTokens {
    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
    });

    const refreshToken = jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }

  /**
   * Log user activity
   */
  private async logActivity(userId: string, action: string, metadata?: any): Promise<void> {
    await this.prisma.activityLog.create({
      data: {
        userId,
        action,
        metadata,
      },
    });
  }

  /**
   * Get user permissions based on role
   */
  static getUserPermissions(role: UserRole): string[] {
    const permissions: Record<UserRole, string[]> = {
      [UserRole.SUPER_ADMIN]: [
        'manage_all_offices',
        'manage_all_users',
        'manage_all_properties',
        'manage_all_transactions',
        'manage_system_settings',
        'view_all_analytics',
        'manage_commission_policy',
        'manage_badges',
        'manage_currency_rates',
      ],
      [UserRole.OFFICE_ADMIN]: [
        'manage_office_users',
        'manage_office_properties',
        'manage_office_transactions',
        'view_office_analytics',
        'manage_office_settings',
      ],
      [UserRole.MANAGER]: [
        'manage_team',
        'approve_collaborations',
        'set_agent_targets',
        'view_team_analytics',
        'manage_own_properties',
        'manage_own_transactions',
      ],
      [UserRole.AGENT]: [
        'manage_own_properties',
        'manage_own_clients',
        'manage_own_leads',
        'manage_own_transactions',
        'view_own_analytics',
      ],
      [UserRole.PUBLIC_USER]: [
        'create_listing',
        'manage_own_listings',
        'promote_listing',
      ],
    };

    return permissions[role] || [];
  }

  /**
   * Check if user has permission
   */
  static hasPermission(role: UserRole, permission: string): boolean {
    const permissions = AuthService.getUserPermissions(role);
    return permissions.includes(permission);
  }
}
