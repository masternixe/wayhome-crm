import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserRole } from '@wayhome/database';

export interface AuthRequest extends Request {
  user: {
    userId: string;
    email: string;
    role: UserRole;
    officeId?: string;
  };
}

export class AuthMiddleware {
  constructor(private authService: AuthService) {}

  /**
   * Middleware to authenticate JWT token
   */
  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = this.extractToken(req);
      
      if (!token) {
        res.status(401).json({ error: 'Access token required' });
        return;
      }

      const payload = await this.authService.validateToken(token);
      (req as AuthRequest).user = payload;
      
      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired token' });
    }
  };

  /**
   * Middleware to check if user has required role
   */
  requireRole = (...roles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const authReq = req as AuthRequest;
      
      if (!authReq.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      if (!roles.includes(authReq.user.role)) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      next();
    };
  };

  /**
   * Middleware to check specific permissions
   */
  requirePermission = (...permissions: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      const authReq = req as AuthRequest;
      
      if (!authReq.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const userPermissions = AuthService.getUserPermissions(authReq.user.role);
      const hasPermission = permissions.some(permission => 
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        res.status(403).json({ error: 'Insufficient permissions' });
        return;
      }

      next();
    };
  };

  /**
   * Middleware to check office access
   * Super admins can access any office, others only their own
   */
  requireOfficeAccess = (req: Request, res: Response, next: NextFunction): void => {
    const authReq = req as AuthRequest;
    
    if (!authReq.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Super admin can access any office
    if (authReq.user.role === UserRole.SUPER_ADMIN) {
      next();
      return;
    }

    const officeId = req.params.officeId || req.body.officeId || req.query.officeId;
    
    // If no specific office requested, allow (will be filtered in service layer)
    if (!officeId) {
      next();
      return;
    }

    // Check if user has access to the requested office
    if (authReq.user.officeId !== officeId) {
      res.status(403).json({ error: 'Access denied to this office' });
      return;
    }

    next();
  };

  /**
   * Middleware to ensure resource ownership
   */
  requireResourceOwnership = (resourceIdParam: string = 'id') => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const authReq = req as AuthRequest;
      
      if (!authReq.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Super admin and office admin can access any resource
      if ([UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN].includes(authReq.user.role)) {
        next();
        return;
      }

      const resourceId = req.params[resourceIdParam];
      
      if (!resourceId) {
        res.status(400).json({ error: 'Resource ID required' });
        return;
      }

      // TODO: Implement resource ownership checking logic based on resource type
      // This would need to be customized per resource type
      next();
    };
  };

  /**
   * Extract token from Authorization header
   */
  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    return authHeader.substring(7);
  }
}

/**
 * Helper function to check if user can access office data
 */
export function canAccessOffice(userRole: UserRole, userOfficeId: string | undefined, targetOfficeId: string): boolean {
  if (userRole === UserRole.SUPER_ADMIN) {
    return true;
  }
  
  return userOfficeId === targetOfficeId;
}

/**
 * Helper function to build office filter for database queries
 */
export function buildOfficeFilter(userRole: UserRole, userOfficeId: string | undefined, requestedOfficeId?: string) {
  if (userRole === UserRole.SUPER_ADMIN) {
    return requestedOfficeId ? { officeId: requestedOfficeId } : {};
  }
  
  return { officeId: userOfficeId };
}

/**
 * Helper function to check if user can manage another user
 */
export function canManageUser(managerRole: UserRole, managerOfficeId: string | undefined, targetRole: UserRole, targetOfficeId: string | undefined): boolean {
  // Super admin can manage anyone
  if (managerRole === UserRole.SUPER_ADMIN) {
    return true;
  }
  
  // Office admin can manage users in their office (except other office admins and super admins)
  if (managerRole === UserRole.OFFICE_ADMIN) {
    if (targetRole === UserRole.SUPER_ADMIN || 
        (targetRole === UserRole.OFFICE_ADMIN && managerOfficeId !== targetOfficeId)) {
      return false;
    }
    return managerOfficeId === targetOfficeId;
  }
  
  // Manager can manage agents in their office
  if (managerRole === UserRole.MANAGER) {
    return targetRole === UserRole.AGENT && managerOfficeId === targetOfficeId;
  }
  
  return false;
}

/**
 * Validation middleware for common scenarios
 */
export const requireAuth = (authService: AuthService) => new AuthMiddleware(authService).authenticate;
export const requireSuperAdmin = (authService: AuthService) => [
  new AuthMiddleware(authService).authenticate,
  new AuthMiddleware(authService).requireRole(UserRole.SUPER_ADMIN)
];
export const requireOfficeAdmin = (authService: AuthService) => [
  new AuthMiddleware(authService).authenticate,
  new AuthMiddleware(authService).requireRole(UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN)
];
export const requireManager = (authService: AuthService) => [
  new AuthMiddleware(authService).authenticate,
  new AuthMiddleware(authService).requireRole(UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN, UserRole.MANAGER)
];
export const requireAgent = (authService: AuthService) => [
  new AuthMiddleware(authService).authenticate,
  new AuthMiddleware(authService).requireRole(UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN, UserRole.MANAGER, UserRole.AGENT)
];
