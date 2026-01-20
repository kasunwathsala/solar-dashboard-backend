import { NextFunction, Request, Response } from "express";
import { z, ZodSchema, ZodError } from "zod";

/**
 * Validation middleware factory for request validation using Zod
 * @param schema - Zod schema to validate against
 * @param source - Which part of the request to validate ('body', 'query', 'params')
 */
export const validateRequest = (
  schema: ZodSchema,
  source: 'body' | 'query' | 'params' = 'body'
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate the specified part of the request
      const validated = await schema.parseAsync(req[source]);
      
      // Replace the request data with validated data
      req[source] = validated;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err: z.ZodIssue) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        return res.status(400).json({
          message: 'Validation failed',
          errors: formattedErrors
        });
      }
      
      // Pass other errors to global error handler
      next(error);
    }
  };
};

/**
 * Common Zod schemas for reuse
 */
export const commonSchemas = {
  // MongoDB ObjectId validation
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format'),
  
  // Pagination
  pagination: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
  
  // Date range
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
  
  // Solar Unit creation
  createSolarUnit: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    serialNumber: z.string().min(1, 'Serial number is required'),
    capacity: z.number().positive('Capacity must be positive'),
    location: z.object({
      address: z.string().optional(),
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }).optional(),
    installationDate: z.string().datetime().optional(),
    userid: z.string().min(1, 'User ID is required'),
  }),
  
  // Invoice generation
  generateInvoice: z.object({
    solarUnitId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid solar unit ID'),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
  }),
  
  // Anomaly resolution
  resolveAnomaly: z.object({
    resolutionNotes: z.string().min(1, 'Resolution notes are required').max(500),
  }),
  
  // Weather query
  weatherQuery: z.object({
    lat: z.string().regex(/^-?\d+\.?\d*$/).transform(Number).refine(val => val >= -90 && val <= 90, 'Invalid latitude'),
    lon: z.string().regex(/^-?\d+\.?\d*$/).transform(Number).refine(val => val >= -180 && val <= 180, 'Invalid longitude'),
  }),
};
