const mongoose = require('mongoose');

// One row per admin action (sign-ins, bans, Pro grants, settings changes...).
// The admin's name and email are copied so the log stays readable after the
// admin account is changed or deactivated.
const adminAuditLogSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser', default: null },
    adminEmail: { type: String, default: '' },
    adminName: { type: String, default: '' },
    action: { type: String, required: true },
    targetType: { type: String, default: null },
    targetId: { type: String, default: null },
    summary: { type: String, default: '' },
    details: { type: mongoose.Schema.Types.Mixed, default: null },
    ip: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

adminAuditLogSchema.index({ createdAt: -1 });
adminAuditLogSchema.index({ action: 1, createdAt: -1 });
adminAuditLogSchema.index({ targetId: 1, createdAt: -1 });

module.exports = mongoose.model('AdminAuditLog', adminAuditLogSchema);
