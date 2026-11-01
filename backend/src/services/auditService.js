const AdminAuditLog = require('../models/AdminAuditLog');
const logger = require('../utils/logger');

/**
 * Records an admin action. Never throws: a logging failure must not undo or
 * fail the action itself.
 */
async function record(req, action, { targetType = null, targetId = null, summary = '', details = null, admin } = {}) {
  const actor = admin || req?.admin || {};
  try {
    await AdminAuditLog.create({
      adminId: actor.id || null,
      adminEmail: actor.email || '',
      adminName: actor.name || '',
      action,
      targetType,
      targetId: targetId == null ? null : String(targetId),
      summary: String(summary || '').slice(0, 500),
      details,
      ip: req?.ip || null,
    });
  } catch (error) {
    logger.error('Could not write admin audit log', { action, message: error.message });
  }
}

async function list({ page = 1, limit = 50, action = '', targetId = '' } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const filter = {};
  // `user.` matches every user action; `user.ban` only bans.
  if (action) {
    const escaped = String(action).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.action = action.endsWith('.') ? new RegExp(`^${escaped}`) : action;
  }
  if (targetId) filter.targetId = String(targetId);

  const [entries, total] = await Promise.all([
    AdminAuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .lean(),
    AdminAuditLog.countDocuments(filter),
  ]);

  return {
    entries: entries.map(({ _id, __v, ...entry }) => ({ id: _id.toString(), ...entry })),
    total,
    page: safePage,
    limit: safeLimit,
    pages: Math.ceil(total / safeLimit) || 1,
  };
}

module.exports = { record, list };
