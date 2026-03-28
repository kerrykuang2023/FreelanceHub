import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult, ValidationChain } from 'express-validator';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    for (const validation of validations) {
      const result = await validation.run(req);
      if (!result.isEmpty()) break;
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors.array().map((err) => ({
            field: err.type === 'field' ? (err as any).path : err.type,
            message: err.msg,
          })),
        },
      });
      return;
    }

    next();
  };
};

export const validateProjectCreate = [
  body('project_title')
    .notEmpty()
    .withMessage('Project title is required')
    .isLength({ max: 200 })
    .withMessage('Project title must be at most 200 characters'),
  body('project_description')
    .notEmpty()
    .withMessage('Project description is required')
    .isLength({ max: 4000 })
    .withMessage('Project description must be at most 4000 characters'),
  body('job_nature')
    .isIn(['全职', '兼职', '自由顾问', '实习'])
    .withMessage('Invalid job nature'),
  body('work_format')
    .isIn(['远程', '现场', '混合'])
    .withMessage('Invalid work format'),
  body('rate_type')
    .isIn(['待面试', '日薪', '月薪', '年薪', '项目总价'])
    .withMessage('Invalid rate type'),
  body('project_major_categories')
    .isArray({ min: 1 })
    .withMessage('At least one major category is required'),
  body('project_sub_categories')
    .isArray({ min: 1 })
    .withMessage('At least one sub category is required'),
  body('project_cycle')
    .notEmpty()
    .withMessage('Project cycle is required'),
];

export const validateWorkLogCreate = [
  body('project_requirement_id')
    .notEmpty()
    .withMessage('Project is required')
    .isMongoId()
    .withMessage('Invalid project ID'),
  body('work_date')
    .notEmpty()
    .withMessage('Work date is required')
    .isDate()
    .withMessage('Invalid work date'),
  body('hours_worked')
    .notEmpty()
    .withMessage('Hours worked is required')
    .isFloat({ min: 0.5, max: 24 })
    .withMessage('Hours worked must be between 0.5 and 24'),
  body('work_type')
    .isIn(['现场开发', '远程工作', '会议', '培训', '出差', '代码评审', '问题修复', '需求分析', '文档编写', '测试', '部署', '其他'])
    .withMessage('Invalid work type'),
  body('work_description')
    .notEmpty()
    .withMessage('Work description is required')
    .isLength({ max: 2000 })
    .withMessage('Work description must be at most 2000 characters'),
];

export const validateInvoiceCreate = [
  body('freelancer_id')
    .notEmpty()
    .withMessage('Freelancer is required')
    .isMongoId()
    .withMessage('Invalid freelancer ID'),
  body('company_id')
    .notEmpty()
    .withMessage('Company is required')
    .isMongoId()
    .withMessage('Invalid company ID'),
  body('invoice_type')
    .isIn(['增值税专用发票', '增值税普通发票', '个人发票', '服务费发票'])
    .withMessage('Invalid invoice type'),
  body('billing_period_start')
    .notEmpty()
    .withMessage('Billing period start is required')
    .isDate()
    .withMessage('Invalid billing period start'),
  body('billing_period_end')
    .notEmpty()
    .withMessage('Billing period end is required')
    .isDate()
    .withMessage('Invalid billing period end'),
  body('tax_rate')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax rate must be between 0 and 100'),
];

export const validateRatingCreate = [
  body('project_id')
    .notEmpty()
    .withMessage('Project is required')
    .isMongoId()
    .withMessage('Invalid project ID'),
  body('reviewee_id')
    .notEmpty()
    .withMessage('Reviewee is required')
    .isMongoId()
    .withMessage('Invalid reviewee ID'),
  body('dimensions.professional_skill')
    .isInt({ min: 1, max: 5 })
    .withMessage('Professional skill rating must be between 1 and 5'),
  body('dimensions.work_attitude')
    .isInt({ min: 1, max: 5 })
    .withMessage('Work attitude rating must be between 1 and 5'),
  body('dimensions.communication')
    .isInt({ min: 1, max: 5 })
    .withMessage('Communication rating must be between 1 and 5'),
  body('dimensions.delivery_quality')
    .isInt({ min: 1, max: 5 })
    .withMessage('Delivery quality rating must be between 1 and 5'),
  body('comment')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comment must be at most 1000 characters'),
];

export const validateTicketCreate = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 200 })
    .withMessage('Title must be at most 200 characters'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 5000 })
    .withMessage('Description must be at most 5000 characters'),
  body('category')
    .isIn(['dispute', 'complaint', 'question', 'other'])
    .withMessage('Invalid category'),
  body('priority')
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
];

export const validateContractCreate = [
  body('template_id')
    .notEmpty()
    .withMessage('Template is required')
    .isMongoId()
    .withMessage('Invalid template ID'),
  body('project_id')
    .notEmpty()
    .withMessage('Project is required')
    .isMongoId()
    .withMessage('Invalid project ID'),
  body('freelancer_id')
    .notEmpty()
    .withMessage('Freelancer is required')
    .isMongoId()
    .withMessage('Invalid freelancer ID'),
  body('company_id')
    .notEmpty()
    .withMessage('Company is required')
    .isMongoId()
    .withMessage('Invalid company ID'),
  body('start_date')
    .notEmpty()
    .withMessage('Start date is required')
    .isDate()
    .withMessage('Invalid start date'),
  body('end_date')
    .notEmpty()
    .withMessage('End date is required')
    .isDate()
    .withMessage('Invalid end date'),
];

export const validateMilestoneCreate = [
  body('project_requirement_id')
    .notEmpty()
    .withMessage('Project is required')
    .isMongoId()
    .withMessage('Invalid project ID'),
  body('milestone_name')
    .notEmpty()
    .withMessage('Milestone name is required')
    .isLength({ max: 200 })
    .withMessage('Milestone name must be at most 200 characters'),
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 2000 })
    .withMessage('Description must be at most 2000 characters'),
  body('planned_start_date')
    .notEmpty()
    .withMessage('Planned start date is required')
    .isDate()
    .withMessage('Invalid planned start date'),
  body('planned_end_date')
    .notEmpty()
    .withMessage('Planned end date is required')
    .isDate()
    .withMessage('Invalid planned end date'),
];

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Page size must be between 1 and 100'),
];

export const validateObjectId = (paramName: string) => [
  param(paramName)
    .notEmpty()
    .withMessage(`${paramName} is required`)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),
];
