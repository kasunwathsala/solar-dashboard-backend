import { getAuth } from "@clerk/express";
import { NextFunction, Response } from "express";
import { AuthenticatedRequest } from "../../domain/types/request";

class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export const authenticationMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
    const auth = getAuth(req);
    if (!auth.userId) {
        throw new UnauthorizedError("Unauthorized");
    }
    req.userId = auth.userId; // Set userId on request
    next();
};