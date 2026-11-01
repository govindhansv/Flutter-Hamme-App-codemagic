const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const AdminUser = require('../models/AdminUser');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const SESSION_TTL = '12h';
const AUDIENCE = 'hamme-admin';
const MIN_PASSWORD_LENGTH = 10;
const BCRYPT_ROUNDS = 12;
// Compared against when the email is unknown, so a failed sign-in takes the
// same time whether or not the account exists.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

// Admin sessions are signed with a key derived from the app's access-token
// secret, so an app user's token can never pass as an admin token (or back).
function signingKey() {
  if (!env.jwtAccessSecret) {
    throw new ApiError(503, 'JWT_ACCESS_SECRET must be configured.');
  }
  return crypto.createHmac('sha256', env.jwtAccessSecret).update('hamme-admin-session-v1').digest();
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function assertPassword(password) {
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    throw new ApiError(422, `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
}

function issueSession(admin) {
  const token = jwt.sign(
    { sub: admin.id, role: admin.role, tv: admin.tokenVersion || 0 },
    signingKey(),
    { audience: AUDIENCE, expiresIn: SESSION_TTL }
  );
  return { token, admin: admin.toJSON() };
}

/** Resolves a session token to the active admin, or throws 401. */
async function verifySession(token) {
  let payload;
  try {
    payload = jwt.verify(token, signingKey(), { audience: AUDIENCE, clockTolerance: 5 });
  } catch (error) {
    throw new ApiError(401, error?.name === 'TokenExpiredError'
      ? 'Your admin session has expired. Sign in again.'
      : 'Your admin session is invalid. Sign in again.');
  }
  const admin = await AdminUser.findById(payload.sub).select('+tokenVersion');
  if (!admin || !admin.isActive || (admin.tokenVersion || 0) !== payload.tv) {
    throw new ApiError(401, 'Your admin session has ended. Sign in again.');
  }
  return admin;
}

async function needsBootstrap() {
  return (await AdminUser.estimatedDocumentCount()) === 0;
}

async function login(email, password) {
  const admin = await AdminUser.findOne({ email: normalizeEmail(email) })
    .select('+passwordHash +tokenVersion');
  const ok = await bcrypt.compare(String(password || ''), admin?.passwordHash || DUMMY_HASH);
  if (!admin || !ok) {
    throw new ApiError(401, 'Wrong email or password.');
  }
  if (!admin.isActive) {
    throw new ApiError(403, 'This admin account has been deactivated.');
  }
  admin.lastLoginAt = new Date();
  await admin.save();
  return issueSession(admin);
}

/**
 * Creates the first owner. Allowed only while no admin exists, and only with
 * the ADMIN_API_KEY, so the panel cannot be claimed by a stranger.
 */
async function bootstrap({ email, name, password }) {
  if (!(await needsBootstrap())) {
    throw new ApiError(409, 'An admin account already exists. Sign in instead.');
  }
  const admin = await createAdmin({ email, name, password, role: 'owner' });
  admin.lastLoginAt = new Date();
  await admin.save();
  return issueSession(admin);
}

async function createAdmin({ email, name, password, role = 'moderator' }) {
  assertPassword(password);
  const normalized = normalizeEmail(email);
  if (await AdminUser.exists({ email: normalized })) {
    throw new ApiError(409, 'An admin with this email already exists.');
  }
  return AdminUser.create({
    email: normalized,
    name: String(name || '').trim() || normalized,
    passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
    role: role === 'owner' ? 'owner' : 'moderator',
  });
}

async function listAdmins() {
  const admins = await AdminUser.find({}).sort({ createdAt: 1 });
  return admins.map((admin) => admin.toJSON());
}

async function assertAnotherActiveOwner(adminId) {
  const others = await AdminUser.countDocuments({ _id: { $ne: adminId }, role: 'owner', isActive: true });
  if (others === 0) {
    throw new ApiError(409, 'There must always be at least one active owner.');
  }
}

/** Changes another admin's role, active state or password (owners only). */
async function updateAdmin(actorId, adminId, { role, isActive, password, name }) {
  const admin = await AdminUser.findById(adminId).select('+tokenVersion');
  if (!admin) throw new ApiError(404, 'Admin not found.');
  const isSelf = String(actorId) === admin.id;

  if (isActive === false && isSelf) {
    throw new ApiError(409, 'You cannot deactivate your own account.');
  }
  const losesOwner = admin.role === 'owner' && admin.isActive &&
    ((role && role !== 'owner') || isActive === false);
  if (losesOwner) await assertAnotherActiveOwner(admin._id);

  if (role) admin.role = role === 'owner' ? 'owner' : 'moderator';
  if (typeof isActive === 'boolean') admin.isActive = isActive;
  if (typeof name === 'string' && name.trim()) admin.name = name.trim().slice(0, 80);
  if (password != null) {
    assertPassword(password);
    admin.passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  }
  // Role, password and deactivation changes end the admin's open sessions.
  if (role || isActive === false || password != null) {
    admin.tokenVersion = (admin.tokenVersion || 0) + 1;
  }
  await admin.save();
  return admin;
}

/** Lets a signed-in admin change their own password; returns a fresh session. */
async function changeOwnPassword(adminId, currentPassword, newPassword) {
  const admin = await AdminUser.findById(adminId).select('+passwordHash +tokenVersion');
  if (!admin) throw new ApiError(404, 'Admin not found.');
  if (!(await bcrypt.compare(String(currentPassword || ''), admin.passwordHash))) {
    throw new ApiError(401, 'Your current password is wrong.');
  }
  assertPassword(newPassword);
  admin.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  admin.tokenVersion = (admin.tokenVersion || 0) + 1;
  await admin.save();
  return issueSession(admin);
}

module.exports = {
  MIN_PASSWORD_LENGTH,
  verifySession,
  needsBootstrap,
  login,
  bootstrap,
  createAdmin,
  listAdmins,
  updateAdmin,
  changeOwnPassword,
};
