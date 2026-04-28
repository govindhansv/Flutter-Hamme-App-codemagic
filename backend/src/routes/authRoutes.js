const express = require('express');
const { body } = require('express-validator');

const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.post(
  '/signup',
  [
    body('name').trim().isLength({ min: 2, max: 80 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6, max: 64 }),
    body('instagramId').trim().notEmpty(),
    body('profileImageUrl').optional({ values: 'falsy' }).isURL(),
  ],
  validateRequest,
  authController.signup
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').isLength({ min: 6 })],
  validateRequest,
  authController.login
);

router.post(
  '/refresh',
  [body('refreshToken').trim().notEmpty()],
  validateRequest,
  authController.refresh
);

router.post('/logout', authMiddleware, authController.logout);
router.get('/me', authMiddleware, authController.me);

module.exports = router;