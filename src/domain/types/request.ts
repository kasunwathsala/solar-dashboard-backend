import { Request } from "express";

/**
 * Extended Request interface with Clerk authentication
 */
export interface AuthenticatedRequest extends Request {
  auth?: {
    userId: string;
    sessionId?: string;
  };
  userId?: string;
  userRole?: "USER" | "ADMIN";
  body: any;
  query: any;
  params: any;
}
