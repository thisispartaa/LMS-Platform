// Type definitions for session and authentication
export interface CustomSessionData {
  userId?: string;
  user?: any;
  isAuthenticated?: boolean;
}

declare module 'express-session' {
  interface SessionData extends CustomSessionData {}
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: any;
  }
}