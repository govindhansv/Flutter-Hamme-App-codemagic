const crypto = require('crypto');

const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const adminAuthService = require('../services/adminAuthService');

function keysMatch(provided, expected) {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** True when the request carries the ADMIN_API_KEY in `x-admin-key`. */
function hasValidAdminKey(req) {
  const provided = req.headers['x-admin-key'];
  return Boolean(env.adminApiKey) && typeof provided === 'string' && keysMatch(provided, env.adminApiKey);
}

/**
 * Protects admin endpoints. Accepts either:
 *  - an admin session (`Authorization: Bearer <token>` from POST /admin/auth/login), or
 *  - the shared ADMIN_API_KEY in the `x-admin-key` header, for scripts and for
 *    creating the first admin account. It acts as an owner.
 * A query parameter is never accepted because request URLs are written to the
 * access logs. Sets `req.admin` to { id, email, name, role }.
 */
async function adminMiddleware(req, res, next) {
  const [scheme, rawToken] = (req.headers.authorization || '').split(' ');
  if (scheme?.toLowerCase() === 'bearer' && rawToken?.trim()) {
    try {
      const admin = await adminAuthService.verifySession(rawToken.trim());
      req.admin = { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
      return next();
    } catch (error) {
      return next(error);
    }
  }

  if (req.headers['x-admin-key'] != null) {
    if (!env.adminApiKey) {
      return next(new ApiError(503, 'Admin API key is not configured.'));
    }
    if (!hasValidAdminKey(req)) {
      return next(new ApiError(401, 'Invalid admin key.'));
    }
    req.admin = { id: null, email: 'api-key', name: 'Admin API key', role: 'owner' };
    return next();
  }

  return next(new ApiError(401, 'Sign in to the admin panel.'));
}

/** Allows only owners (money, Pro grants, settings, admins, audit log). */
function requireOwner(req, res, next) {
  if (req.admin?.role !== 'owner') {
    return next(new ApiError(403, 'Only an owner can do this.'));
  }
  return next();
}

module.exports = adminMiddleware;
module.exports.requireOwner = requireOwner;
module.exports.hasValidAdminKey = hasValidAdminKey;
