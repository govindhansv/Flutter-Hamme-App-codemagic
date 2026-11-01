const Interaction = require('../models/Interaction');
const Match = require('../models/Match');
const User = require('../models/User');
const UserReport = require('../models/UserReport');
const ApiError = require('../utils/ApiError');
const revenueService = require('./revenueService');

const DAY_MS = 24 * 60 * 60 * 1000;
const SIGNUP_CHART_DAYS = 30;

function safeTimeZone(tz) {
  try {
    if (tz) {
      new Intl.DateTimeFormat('en-US', { timeZone: tz });
      return tz;
    }
  } catch (_) {
    // Unknown zone name.
  }
  return 'UTC';
}

/** Numbers for the Overview tab. */
async function getOverview({ tz } = {}) {
  const timezone = safeTimeZone(tz);
  const now = Date.now();
  const since = (days) => new Date(now - days * DAY_MS);

  const [
    totalUsers,
    guestUsers,
    bannedUsers,
    new1d,
    new7d,
    new30d,
    proTotal,
    proAndroid,
    proIos,
    proAdmin,
    votes7d,
    matches7d,
    openReports,
    overdueReports,
    signups,
    revenue30d,
  ] = await Promise.all([
    User.estimatedDocumentCount(),
    User.countDocuments({ isGuestUser: true }),
    User.countDocuments({ isBanned: true }),
    User.countDocuments({ createdAt: { $gte: since(1) } }),
    User.countDocuments({ createdAt: { $gte: since(7) } }),
    User.countDocuments({ createdAt: { $gte: since(30) } }),
    User.countDocuments({ isPro: true }),
    User.countDocuments({ storeProActive: true, proPlatform: 'android', proExpiryAt: { $gt: new Date(now) } }),
    User.countDocuments({ storeProActive: true, proPlatform: 'ios', proExpiryAt: { $gt: new Date(now) } }),
    User.countDocuments({ adminPro: true }),
    Interaction.countDocuments({ createdAt: { $gte: since(7) } }),
    Match.countDocuments({ createdAt: { $gte: since(7) } }),
    UserReport.countDocuments({ status: 'open' }),
    UserReport.countDocuments({ status: 'open', createdAt: { $lt: since(1) } }),
    User.aggregate([
      { $match: { createdAt: { $gte: since(SIGNUP_CHART_DAYS) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    revenueService.totalsSince(since(30)),
  ]);

  return {
    users: { total: totalUsers, guests: guestUsers, banned: bannedUsers, new1d, new7d, new30d },
    pro: { total: proTotal, android: proAndroid, ios: proIos, admin: proAdmin },
    activity: { votes7d, matches7d },
    reports: { open: openReports, overdue: overdueReports },
    signups: signups.map((row) => ({ day: row._id, count: row.count })),
    revenue30d,
    timezone,
  };
}

/** Everything the user detail drawer shows. */
async function getUserDetail(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'User not found.');

  const [votesSent, votesReceived, matches, reportsAgainst, reportsFiled, openReportsAgainst, payments] =
    await Promise.all([
      Interaction.countDocuments({ fromUser: user._id }),
      Interaction.countDocuments({ toUser: user._id }),
      Match.countDocuments({ $or: [{ userA: user._id }, { userB: user._id }] }),
      UserReport.countDocuments({ reportedUser: user._id }),
      UserReport.countDocuments({ reporter: user._id }),
      UserReport.countDocuments({ reportedUser: user._id, status: 'open' }),
      revenueService.paymentsForUser(user._id),
    ]);

  return {
    user: toAdminUserJson(user),
    stats: { votesSent, votesReceived, matches, reportsAgainst, reportsFiled, openReportsAgainst },
    payments,
  };
}

/** User JSON for the panel: push tokens are replaced by the device platforms. */
function toAdminUserJson(user) {
  const json = typeof user.toJSON === 'function' ? user.toJSON() : { ...user };
  const devices = Array.isArray(json.deviceTokens) ? json.deviceTokens : [];
  json.devicePlatforms = [...new Set(devices.map((d) => d.platform).filter(Boolean))];
  delete json.deviceTokens;
  return json;
}

module.exports = { getOverview, getUserDetail, toAdminUserJson };
