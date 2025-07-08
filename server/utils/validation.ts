import { z } from 'zod';

// Common validation schemas
export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a valid number').transform(Number)
});

export const userIdParamSchema = z.object({
  userId: z.string().min(1, 'User ID is required')
});

export const moduleIdParamSchema = z.object({
  moduleId: z.string().regex(/^\d+$/, 'Module ID must be a valid number').transform(Number)
});

export const paginationSchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(parseInt(val) || 10, 100) : 10)
});

// Quiz submission validation
export const quizSubmissionSchema = z.object({
  moduleId: z.number().int().positive('Module ID must be a positive integer'),
  answers: z.record(z.string()).optional().default({}),
  score: z.number().int().min(0, 'Score must be non-negative'),
  totalQuestions: z.number().int().positive('Total questions must be positive')
});

// User invitation validation
export const userInvitationSchema = z.object({
  email: z.string().email('Valid email is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['admin', 'trainer', 'employee'], {
    errorMap: () => ({ message: 'Role must be admin, trainer, or employee' })
  })
});

// File upload validation
export const fileUploadSchema = z.object({
  originalname: z.string().min(1, 'Original filename is required'),
  mimetype: z.string().refine(
    type => [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'video/mp4',
      'video/avi',
      'video/quicktime'
    ].includes(type),
    'Unsupported file type'
  ),
  size: z.number().max(100 * 1024 * 1024, 'File size must be less than 100MB')
});

// Helper function to validate request parameters
export function validateParams<T>(schema: z.ZodSchema<T>, params: unknown): T {
  const result = schema.safeParse(params);
  if (!result.success) {
    const errorMessage = result.error.errors.map(err => err.message).join(', ');
    throw new Error(`Validation error: ${errorMessage}`);
  }
  return result.data;
}

// Helper function to validate request body
export function validateBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const errorMessage = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
    throw new Error(`Validation error: ${errorMessage}`);
  }
  return result.data;
}

// Helper function to validate request query parameters
export function validateQuery<T>(schema: z.ZodSchema<T>, query: unknown): T {
  const result = schema.safeParse(query);
  if (!result.success) {
    const errorMessage = result.error.errors.map(err => err.message).join(', ');
    throw new Error(`Query validation error: ${errorMessage}`);
  }
  return result.data;
}