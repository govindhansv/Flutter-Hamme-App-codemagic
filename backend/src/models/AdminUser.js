const mongoose = require('mongoose');

// A person who can sign in to the admin panel. Separate from app users.
// - owner: everything, including money, Pro grants, settings and admins.
// - moderator: reports, users (view, ban, unban) and the overview.
const adminUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['owner', 'moderator'], default: 'moderator' },
    isActive: { type: Boolean, default: true },
    // Bumped on password change or deactivation: older session tokens stop working.
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.passwordHash;
        delete ret.tokenVersion;
        return ret;
      },
    },
  }
);

module.exports = mongoose.model('AdminUser', adminUserSchema);
