import { body, validationResult } from 'express-validator';

/**
 * Middleware to validate request data using express-validator
 */
export const validate = (validations) => {
    return async (req, res, next) => {
        // Run all validations
        await Promise.all(validations.map(validation => validation.run(req)));

        // Check for errors
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array().map(err => ({
                    field: err.path,
                    message: err.msg
                }))
            });
        }

        next();
    };
};

/**
 * Validation rules for user registration
 */
export const registerValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

/**
 * Validation rules for user login
 */
export const loginValidation = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
];

/**
 * Validation rules for expense creation/update
 */
export const expenseValidation = [
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),

    body('category')
        .notEmpty().withMessage('Category is required')
        .isIn(['Food', 'Travel', 'Rent', 'Shopping', 'Entertainment', 'Healthcare', 'Bills', 'Education', 'Others'])
        .withMessage('Invalid category'),

    body('description')
        .trim()
        .notEmpty().withMessage('Description is required')
        .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),

    body('date')
        .optional()
        .isISO8601().withMessage('Invalid date format')
];

/**
 * Validation rules for budget creation/update
 */
export const budgetValidation = [
    body('category')
        .notEmpty().withMessage('Category is required')
        .isIn(['Food', 'Travel', 'Rent', 'Shopping', 'Entertainment', 'Healthcare', 'Bills', 'Education', 'Others'])
        .withMessage('Invalid category'),

    body('monthlyLimit')
        .notEmpty().withMessage('Monthly limit is required')
        .isFloat({ min: 0 }).withMessage('Monthly limit must be greater than or equal to 0'),

    body('month')
        .notEmpty().withMessage('Month is required')
        .matches(/^\d{4}-(0[1-9]|1[0-2])$/).withMessage('Month must be in YYYY-MM format')
];
