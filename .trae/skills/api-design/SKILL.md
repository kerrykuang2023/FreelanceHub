---
name: "api-design"
description: "REST API design patterns for Express.js backend. Invoke when creating routes, controllers, or designing API endpoints with proper authentication and error handling."
---

# API Design

Comprehensive guide for designing and implementing RESTful APIs with Express.js, following best practices for authentication, error handling, and consistent response formats.

## REST Conventions

### HTTP Methods

| Method | Purpose | Idempotent |
|--------|---------|------------|
| GET | Retrieve resources | Yes |
| POST | Create new resources | No |
| PUT | Update entire resource | Yes |
| PATCH | Partial update | No |
| DELETE | Remove resource | Yes |

### Status Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation errors |
| 401 | Unauthorized | Missing/invalid auth |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Unexpected errors |

## Project Structure

```
server/src/
├── routes/           # Route definitions
│   ├── index.ts
│   ├── auth.routes.ts
│   ├── jobs.routes.ts
│   └── users.routes.ts
├── controllers/       # Request handlers
│   ├── auth.controller.ts
│   ├── jobs.controller.ts
│   └── users.controller.ts
├── middlewares/       # Express middleware
│   ├── auth.middleware.ts
│   └── error.middleware.ts
├── models/           # Mongoose models
│   └── ...
├── utils/            # Utility functions
│   └── async-wrapper.ts
├── errors/           # Custom error classes
│   └── ApiError.ts
└── validators/       # Request validation
    └── RequestValidator.ts
```

## Route Pattern

### Standard CRUD Routes

```typescript
// routes/example.routes.ts
import express, { Router } from 'express';
import asyncWrapper from '../utils/async-wrapper';
import authMiddleware from '../middlewares/auth.middleware';
import ExampleController from '../controllers/example.controller';

const router: Router = express.Router();

router.get('/', asyncWrapper(ExampleController.getAll));
router.get('/:id', asyncWrapper(ExampleController.getById));
router.post('/', authMiddleware, asyncWrapper(ExampleController.create));
router.put('/:id', authMiddleware, asyncWrapper(ExampleController.update));
router.delete('/:id', authMiddleware, asyncWrapper(ExampleController.delete));

export default router;
```

### Route Registration

```typescript
// routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import jobRoutes from './jobs.routes';
import userRoutes from './users.routes';
import exampleRoutes from './example.routes';

const router = Router;

router.use('/auth', authRoutes);
router.use('/jobs', jobRoutes);
router.use('/users', userRoutes);
router.use('/examples', exampleRoutes);

export default router;
```

## Controller Pattern

### Standard Controller Structure

```typescript
// controllers/example.controller.ts
import { Request, Response, NextFunction } from 'express';
import asyncHandler from '../utils/async-handler';
import ExampleService from '../services/example.service';
import ApiError from '../errors/ApiError';

class ExampleController {
  private exampleService: ExampleService;

  constructor() {
    this.exampleService = new ExampleService();
  }

  getAll = asyncHandler(async (req: Request, res: Response) => {
    const examples = await this.exampleService.findAll(req.query);
    res.json({ success: true, data: examples });
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const example = await this.exampleService.findById(id);

    if (!example) {
      throw new ApiError(404, 'Example not found');
    }

    res.json({ success: true, data: example });
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const created = await this.exampleService.create(req.body);
    res.status(201).json({ success: true, data: created });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updated = await this.exampleService.update(id, req.body);

    if (!updated) {
      throw new ApiError(404, 'Example not found');
    }

    res.json({ success: true, data: updated });
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const deleted = await this.exampleService.delete(id);

    if (!deleted) {
      throw new ApiError(404, 'Example not found');
    }

    res.status(204).send();
  });
}

export default new ExampleController();
```

## Async Wrapper

### Error Handling Wrapper

```typescript
// utils/async-wrapper.ts
import { Request, Response, NextFunction } from 'express';

const asyncWrapper = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncWrapper;
```

## Authentication

### Auth Middleware

```typescript
// middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import ApiError from '../errors/ApiError';

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwt_secret');
    (req as any).user = decoded;

    next();
  } catch (error) {
    throw new ApiError(401, 'Invalid or expired token');
  }
};

export default authMiddleware;
```

### Role-Based Access

```typescript
// For role-specific routes
const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !roles.includes(user.user_type_name)) {
      throw new ApiError(403, 'Insufficient permissions');
    }
    next();
  };
};

// Usage
router.delete('/:id', authMiddleware, requireRole(['hr_recruiter']), asyncWrapper(Controller.delete));
```

## Request Validation

### Using Joi or Zod

```typescript
// validators/example.validator.ts
import Joi from 'joi';

const createSchema = Joi.object({
  field1: Joi.string().required().max(100),
  field2: Joi.number().required().min(0),
  field3: Joi.string().valid('option1', 'option2', 'option3'),
  nested: Joi.object({
    nestedField: Joi.string()
  })
});

const updateSchema = Joi.object({
  field1: Joi.string().max(100),
  field2: Joi.number().min(0)
}).min(1); // At least one field required

export const validateCreate = (data: unknown) => createSchema.validate(data);
export const validateUpdate = (data: unknown) => updateSchema.validate(data);
```

### Validation Middleware

```typescript
const validate = (schema: Joi.Schema, property: 'body' | 'query' | 'params') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property]);

    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    req[property] = value;
    next();
  };
};

// Usage
router.post('/', authMiddleware, validate(createSchema, 'body'), asyncWrapper(Controller.create));
```

## Response Format

### Success Response

```typescript
// Single resource
res.json({
  success: true,
  data: { /* resource */ }
});

// Multiple resources with pagination
res.json({
  success: true,
  data: {
    items: [/* array of resources */],
    pagination: {
      current_page: 1,
      total_pages: 10,
      total_items: 100,
      items_per_page: 10
    }
  }
});

// With message
res.json({
  success: true,
  message: 'Operation successful',
  data: { /* resource */ }
});
```

### Error Response

```typescript
// Validation error
res.status(400).json({
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input data',
    details: [
      { field: 'email', message: 'Invalid email format' }
    ]
  }
});

// Not found
res.status(404).json({
  success: false,
  error: {
    code: 'NOT_FOUND',
    message: 'Resource not found'
  }
});

// Server error
res.status(500).json({
  success: false,
  error: {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred'
  }
});
```

## API Documentation

### Route Documentation

```typescript
/**
 * @route   GET /api/examples
 * @desc    Get all examples with pagination
 * @access  Public
 * @query   { number } page - Page number (default: 1)
 * @query   { number } limit - Items per page (default: 10)
 * @returns { success: true, data: { items: [], pagination: {} } }
 */

/**
 * @route   POST /api/examples
 * @desc    Create a new example
 * @access  Private (requires authentication)
 * @body    { field1: string, field2: number }
 * @returns { success: true, data: created_example }
 */
```

## Freelancer Platform API Examples

### Work Log API

```typescript
// POST /api/work-logs - Create work log
router.post('/', authMiddleware, asyncWrapper(WorkLogController.create));

// PUT /api/work-logs/:id/submit - Submit for confirmation
router.put('/:id/submit', authMiddleware, asyncWrapper(WorkLogController.submit));

// PUT /api/work-logs/:id/confirm - Confirm work log (company)
router.put('/:id/confirm', authMiddleware, requireRole(['hr_recruiter', 'company_admin']),
  asyncWrapper(WorkLogController.confirm));

// PUT /api/work-logs/:id/reject - Reject work log
router.put('/:id/reject', authMiddleware, requireRole(['hr_recruiter', 'company_admin']),
  asyncWrapper(WorkLogController.reject));

// POST /api/work-logs/batch/submit - Batch submit
router.post('/batch/submit', authMiddleware, asyncWrapper(WorkLogController.batchSubmit));
```

### Payment API

```typescript
// POST /api/payment-requests - Create payment request
router.post('/', authMiddleware, asyncWrapper(PaymentRequestController.create));

// GET /api/payment-requests - List user's payment requests
router.get('/', authMiddleware, asyncWrapper(PaymentRequestController.list));

// PUT /api/payment-requests/:id/approve - Approve payment request
router.put('/:id/approve', authMiddleware, requireRole(['hr_recruiter', 'company_admin']),
  asyncWrapper(PaymentRequestController.approve));

// POST /api/payment-records/:id/upload-voucher - Upload payment voucher
router.post('/:id/upload-voucher', authMiddleware,
  asyncWrapper(PaymentRecordController.uploadVoucher));
```

## Pagination

### Query Parameters

```
GET /api/resource?page=1&limit=10&sort=created_at&order=desc&search=keyword
```

### Pagination Implementation

```typescript
const paginate = async (model, query, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    model.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
    model.countDocuments(query)
  ]);

  return {
    items,
    pagination: {
      current_page: Number(page),
      total_pages: Math.ceil(total / limit),
      total_items: total,
      items_per_page: Number(limit)
    }
  };
};
```
