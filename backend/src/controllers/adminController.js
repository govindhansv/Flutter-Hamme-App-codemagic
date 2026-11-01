const userService = require('../services/userService');
const appConfigService = require('../services/appConfigService');
const moderationService = require('../services/moderationService');
const reportService = require('../services/reportService');
const adminAuthService = require('../services/adminAuthService');
const adminStatsService = require('../services/adminStatsService');
const auditService = require('../services/auditService');
const billingService = require('../services/billingService');
const revenueService = require('../services/revenueService');
const { hasValidAdminKey } = require('../middleware/adminMiddleware');
const ApiError = require('../utils/ApiError');

function whoLabel(user) {
  if (!user) return 'a user';
  if (user.username) return `@${user.username}`;
  return user.name || user.email || user.id;
}

// ── Sign-in ─────────────────────────────────────────────────────────────────

async function authStatus(req, res) {
  return res.status(200).json({ needsBootstrap: await adminAuthService.needsBootstrap() });
}

async function login(req, res) {
  try {
    const session = await adminAuthService.login(req.body.email, req.body.password);
    await auditService.record(req, 'auth.login', { admin: session.admin, summary: 'Signed in' });
    return res.status(200).json(session);
  } catch (error) {
    if (error?.statusCode === 401 || error?.statusCode === 403) {
      await auditService.record(req, 'auth.login_failed', {
        admin: { email: String(req.body.email || '').slice(0, 200) },
        summary: error.message,
      });
    }
    throw error;
  }
}

async function bootstrap(req, res) {
  if (!hasValidAdminKey(req)) {
    throw new ApiError(401, 'Enter the correct ADMIN_API_KEY to create the first owner.');
  }
  const session = await adminAuthService.bootstrap(req.body);
  await auditService.record(req, 'admin.bootstrap', {
    admin: session.admin,
    targetType: 'admin',
    targetId: session.admin.id,
    summary: `Created the first owner account (${session.admin.email})`,
  });
  return res.status(201).json(session);
}

async function me(req, res) {
  return res.status(200).json({ admin: req.admin });
}

async function changePassword(req, res) {
  if (!req.admin.id) throw new ApiError(400, 'The API key has no password to change.');
  const session = await adminAuthService.changeOwnPassword(req.admin.id, req.body.currentPassword, req.body.newPassword);
  await auditService.record(req, 'admin.password_change', {
    targetType: 'admin', targetId: req.admin.id, summary: 'Changed own password',
  });
  return res.status(200).json(session);
}

// ── Overview & users ────────────────────────────────────────────────────────

async function overview(req, res) {
  return res.status(200).json(await adminStatsService.getOverview({ tz: req.query.tz }));
}

async function listUsers(req, res) {
  const result = await userService.listUsers({
    search: req.query.search,
    page: req.query.page,
    limit: req.query.limit,
  });
  result.users = result.users.map(adminStatsService.toAdminUserJson);
  return res.status(200).json(result);
}

async function userDetail(req, res) {
  return res.status(200).json(await adminStatsService.getUserDetail(req.params.id));
}

async function setPlan(req, res) {
  const user = await userService.setProStatus(req.params.id, req.body.isPro);
  await auditService.record(req, req.body.isPro ? 'user.grant_pro' : 'user.revoke_pro', {
    targetType: 'user',
    targetId: user.id,
    summary: `${req.body.isPro ? 'Granted' : 'Removed'} free Pro for ${whoLabel(user)}`,
  });
  return res.status(200).json({ user: adminStatsService.toAdminUserJson(user) });
}

async function banUser(req, res) {
  const user = await moderationService.banUser(req.params.id, { reason: req.body?.reason });
  await auditService.record(req, 'user.ban', {
    targetType: 'user',
    targetId: user.id,
    summary: `Banned ${whoLabel(user)}`,
    details: user.banReason ? { reason: user.banReason } : null,
  });
  return res.status(200).json({ user: adminStatsService.toAdminUserJson(user) });
}

async function unbanUser(req, res) {
  const user = await moderationService.unbanUser(req.params.id);
  await auditService.record(req, 'user.unban', {
    targetType: 'user', targetId: user.id, summary: `Unbanned ${whoLabel(user)}`,
  });
  return res.status(200).json({ user: adminStatsService.toAdminUserJson(user) });
}

async function deleteUser(req, res) {
  const { user } = await adminStatsService.getUserDetail(req.params.id);
  await userService.deleteMe(req.params.id);
  await auditService.record(req, 'user.delete', {
    targetType: 'user',
    targetId: req.params.id,
    summary: `Deleted the account of ${whoLabel(user)}`,
    details: { name: user.name || '', email: user.email || '', username: user.username || '', reason: req.body?.reason || null },
  });
  return res.status(200).json({ deleted: true });
}

// ── Reports ─────────────────────────────────────────────────────────────────

async function listReports(req, res) {
  const result = await reportService.listReports({
    status: req.query.status,
    page: req.query.page,
    limit: req.query.limit,
  });
  return res.status(200).json(result);
}

const REPORT_ACTION_LABELS = {
  remove_content: 'Removed reported content',
  remove_and_ban: 'Removed reported content and banned the offender',
  dismiss: 'Dismissed a report',
};

async function actOnReport(req, res) {
  const report = await moderationService.actOnReport(req.params.id, {
    action: req.body.action,
    note: req.body.note,
  });
  await auditService.record(req, `report.${req.body.action}`, {
    targetType: 'report',
    targetId: req.params.id,
    summary: REPORT_ACTION_LABELS[req.body.action] || req.body.action,
    details: {
      reportedUserId: report?.reportedUserId || null,
      reason: report?.reason || null,
      note: req.body.note || null,
    },
  });
  return res.status(200).json({ report });
}

// ── Settings ────────────────────────────────────────────────────────────────

async function getConfig(req, res) {
  const config = await appConfigService.getConfig();
  return res.status(200).json({ config });
}

async function updateConfig(req, res) {
  const before = await appConfigService.getConfig();
  const { freeUserCardLimit, cardCooldownMinutes } = req.body;
  const config = await appConfigService.updateConfig({ freeUserCardLimit, cardCooldownMinutes });
  await auditService.record(req, 'config.update', {
    targetType: 'config',
    summary: `Changed play settings: ${before.freeUserCardLimit} → ${config.freeUserCardLimit} cards, ` +
      `${before.cardCooldownMinutes} → ${config.cardCooldownMinutes} min cooldown`,
    details: {
      before,
      after: { freeUserCardLimit: config.freeUserCardLimit, cardCooldownMinutes: config.cardCooldownMinutes },
    },
  });
  return res.status(200).json({ config });
}

// ── Money ───────────────────────────────────────────────────────────────────

async function revenue(req, res) {
  const result = await revenueService.getRevenue({
    platform: req.query.platform,
    granularity: req.query.granularity,
    from: req.query.from,
    to: req.query.to,
    currency: req.query.currency,
    includeTest: req.query.includeTest === 'true',
    tz: req.query.tz,
    todayStart: req.query.todayStart,
    monthStart: req.query.monthStart,
    yearStart: req.query.yearStart,
  });
  return res.status(200).json(result);
}

async function syncRevenue(req, res) {
  const result = await billingService.syncRevenueHistory();
  await auditService.record(req, 'revenue.sync', {
    summary: `Synced store payments: ${result.subscriptions} subscriptions, ${result.payments} payments` +
      (result.failed ? `, ${result.failed} failed` : ''),
    details: result,
  });
  return res.status(200).json(result);
}

// ── Audit log & admins ──────────────────────────────────────────────────────

async function listAudit(req, res) {
  return res.status(200).json(await auditService.list({
    page: req.query.page,
    limit: req.query.limit,
    action: req.query.action,
    targetId: req.query.targetId,
  }));
}

async function listAdmins(req, res) {
  return res.status(200).json({ admins: await adminAuthService.listAdmins() });
}

async function createAdmin(req, res) {
  const admin = await adminAuthService.createAdmin(req.body);
  await auditService.record(req, 'admin.create', {
    targetType: 'admin',
    targetId: admin.id,
    summary: `Added ${admin.role} ${admin.email}`,
  });
  return res.status(201).json({ admin: admin.toJSON() });
}

async function updateAdmin(req, res) {
  const { role, isActive, password, name } = req.body;
  const admin = await adminAuthService.updateAdmin(req.admin.id, req.params.id, { role, isActive, password, name });
  const changes = [];
  if (role) changes.push(`role → ${admin.role}`);
  if (typeof isActive === 'boolean') changes.push(isActive ? 'reactivated' : 'deactivated');
  if (password != null) changes.push('password reset');
  if (name) changes.push('renamed');
  await auditService.record(req, 'admin.update', {
    targetType: 'admin',
    targetId: admin.id,
    summary: `Updated ${admin.email}: ${changes.join(', ') || 'no changes'}`,
  });
  return res.status(200).json({ admin: admin.toJSON() });
}

module.exports = {
  authStatus,
  login,
  bootstrap,
  me,
  changePassword,
  overview,
  listUsers,
  userDetail,
  setPlan,
  banUser,
  unbanUser,
  deleteUser,
  listReports,
  actOnReport,
  getConfig,
  updateConfig,
  revenue,
  syncRevenue,
  listAudit,
  listAdmins,
  createAdmin,
  updateAdmin,
};
