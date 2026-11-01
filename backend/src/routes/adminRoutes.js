const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, param, query } = require('express-validator');

const adminController = require('../controllers/adminController');
const adminMiddleware = require('../middleware/adminMiddleware');
const validateRequest = require('../middleware/validateRequest');
const adminPanelHtml = require('../views/adminPanel');

const { requireOwner } = adminMiddleware;
const router = express.Router();

// Slows down password guessing on the sign-in endpoints.
const signInLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { message: 'Too many sign-in attempts. Wait 15 minutes and try again.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, forwardedHeader: false },
});

const PASSWORD_MAX = 200;

// Self-contained admin UI. The page itself is public; every data/action request
// it makes is authenticated with the admin's session token.
router.get('/', (req, res) => {
  // Relax CSP for this self-contained page (inline script/style + remote avatars).
  res.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src * data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'"
  );
  res.set('Content-Type', 'text/html; charset=utf-8');
  res.send(adminPanelHtml);
});

// ── Sign-in ─────────────────────────────────────────────────────────────────
router.get('/auth/status', adminController.authStatus);

router.post(
  '/auth/login',
  signInLimiter,
  [
    body('email').isString().trim().isLength({ min: 3, max: 200 }),
    body('password').isString().isLength({ min: 1, max: PASSWORD_MAX }),
  ],
  validateRequest,
  adminController.login
);

// First owner account; requires the ADMIN_API_KEY in `x-admin-key`.
router.post(
  '/auth/bootstrap',
  signInLimiter,
  [
    body('email').isEmail().isLength({ max: 200 }),
    body('name').isString().trim().isLength({ min: 1, max: 80 }),
    body('password').isString().isLength({ max: PASSWORD_MAX }),
  ],
  validateRequest,
  adminController.bootstrap
);

router.get('/auth/me', adminMiddleware, adminController.me);

router.post(
  '/auth/password',
  adminMiddleware,
  signInLimiter,
  [
    body('currentPassword').isString().isLength({ max: PASSWORD_MAX }),
    body('newPassword').isString().isLength({ max: PASSWORD_MAX }),
  ],
  validateRequest,
  adminController.changePassword
);

// ── Overview & users ────────────────────────────────────────────────────────
router.get('/stats', adminMiddleware, adminController.overview);

router.get('/users', adminMiddleware, adminController.listUsers);

router.get(
  '/users/:id',
  adminMiddleware,
  [param('id').isMongoId()],
  validateRequest,
  adminController.userDetail
);

router.patch(
  '/users/:id/plan',
  adminMiddleware,
  requireOwner,
  [param('id').isMongoId(), body('isPro').isBoolean()],
  validateRequest,
  adminController.setPlan
);

router.post(
  '/users/:id/ban',
  adminMiddleware,
  [
    param('id').isMongoId(),
    body('reason').optional({ values: 'null' }).isString().isLength({ max: 500 }),
  ],
  validateRequest,
  adminController.banUser
);

router.post(
  '/users/:id/unban',
  adminMiddleware,
  [param('id').isMongoId()],
  validateRequest,
  adminController.unbanUser
);

router.delete(
  '/users/:id',
  adminMiddleware,
  requireOwner,
  [
    param('id').isMongoId(),
    body('reason').optional({ values: 'null' }).isString().isLength({ max: 500 }),
  ],
  validateRequest,
  adminController.deleteUser
);

// ── Moderation queue ────────────────────────────────────────────────────────
// Reports must be acted on within 24 hours (Guideline 1.2).
router.get(
  '/reports',
  adminMiddleware,
  [
    query('status').optional().isIn(['open', 'actioned', 'dismissed', 'all']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validateRequest,
  adminController.listReports
);

router.post(
  '/reports/:id/action',
  adminMiddleware,
  [
    param('id').isMongoId(),
    body('action').isIn(['remove_and_ban', 'remove_content', 'dismiss']),
    body('note').optional({ values: 'null' }).isString().isLength({ max: 1000 }),
  ],
  validateRequest,
  adminController.actOnReport
);

// ── Settings ────────────────────────────────────────────────────────────────
router.get('/config', adminMiddleware, adminController.getConfig);

router.patch(
  '/config',
  adminMiddleware,
  requireOwner,
  [
    body('freeUserCardLimit').optional().isInt({ min: 1, max: 1000 }),
    body('cardCooldownMinutes').optional().isInt({ min: 1, max: 1440 }),
  ],
  validateRequest,
  adminController.updateConfig
);

// ── Money ───────────────────────────────────────────────────────────────────
router.get(
  '/revenue',
  adminMiddleware,
  requireOwner,
  [
    query('platform').optional().isIn(['all', 'android', 'ios']),
    query('granularity').optional().isIn(['day', 'month', 'year']),
    query(['from', 'to', 'todayStart', 'monthStart', 'yearStart']).optional().isISO8601(),
    query('currency').optional().isString().isLength({ min: 3, max: 3 }),
    query('includeTest').optional().isIn(['true', 'false']),
    query('tz').optional().isString().isLength({ max: 64 }),
  ],
  validateRequest,
  adminController.revenue
);

router.post('/revenue/sync', adminMiddleware, requireOwner, adminController.syncRevenue);

// ── Audit log & admins ──────────────────────────────────────────────────────
router.get(
  '/audit',
  adminMiddleware,
  requireOwner,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('action').optional().isString().isLength({ max: 60 }),
    query('targetId').optional().isString().isLength({ max: 60 }),
  ],
  validateRequest,
  adminController.listAudit
);

router.get('/admins', adminMiddleware, requireOwner, adminController.listAdmins);

router.post(
  '/admins',
  adminMiddleware,
  requireOwner,
  [
    body('email').isEmail().isLength({ max: 200 }),
    body('name').isString().trim().isLength({ min: 1, max: 80 }),
    body('password').isString().isLength({ max: PASSWORD_MAX }),
    body('role').isIn(['owner', 'moderator']),
  ],
  validateRequest,
  adminController.createAdmin
);

router.patch(
  '/admins/:id',
  adminMiddleware,
  requireOwner,
  [
    param('id').isMongoId(),
    body('role').optional().isIn(['owner', 'moderator']),
    body('isActive').optional().isBoolean({ strict: true }),
    body('password').optional().isString().isLength({ max: PASSWORD_MAX }),
    body('name').optional().isString().trim().isLength({ min: 1, max: 80 }),
  ],
  validateRequest,
  adminController.updateAdmin
);

module.exports = router;
