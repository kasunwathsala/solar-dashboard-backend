import { getAuth } from "@clerk/express";
import { NextFunction, Request, Response } from "express";

class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export const authenticationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
    const auth = getAuth(req);
    if (!auth.userId) {
        throw new UnauthorizedError("Unauthorized");
    }
    next();
};