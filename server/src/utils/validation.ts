import { body } from 'express-validator';

export const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('username').trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/),
  body('password').isLength({ min: 6 }),
  body('name').trim().isLength({ min: 2, max: 50 }),
  body('country').trim().notEmpty(),
  body('languages').isArray({ min: 1 })
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

export const postValidation = [
  body('title').trim().isLength({ min: 3, max: 200 }),
  body('content').trim().isLength({ min: 10, max: 5000 }),
  body('category').isIn(['Food', 'Traditions', 'Language', 'Travel', 'Art', 'Music', 'History', 'Daily Life', 'Other'])
];

export const messageValidation = [
  body('receiver').isMongoId(),
  body('content').trim().isLength({ min: 1, max: 2000 })
];
