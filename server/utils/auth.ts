import type { Request } from "express";

/**
 * Extract user ID consistently from request object
 * Handles both Replit auth (claims.sub) and local auth (user.id)
 */
export function getUserId(req: Request): string {
  const user = req.user as any;
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // For Replit auth, user ID is in claims.sub
  if (user.claims && user.claims.sub) {
    return user.claims.sub;
  }

  // For local auth, user ID is directly on user.id
  if (user.id) {
    return user.id;
  }

  throw new Error('Unable to extract user ID from request');
}

/**
 * Get user ID safely, returning null if not found instead of throwing
 */
export function getUserIdSafe(req: Request): string | null {
  try {
    return getUserId(req);
  } catch {
    return null;
  }
}

/**
 * Check if user has required role
 */
export function hasRole(req: Request, requiredRole: string): boolean {
  const user = req.user as any;
  if (!user) return false;
  
  return user.role === requiredRole;
}

/**
 * Check if user is admin or trainer
 */
export function isAdminOrTrainer(req: Request): boolean {
  return hasRole(req, 'admin') || hasRole(req, 'trainer');
}