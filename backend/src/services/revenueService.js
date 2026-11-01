const StorePayment = require('../models/StorePayment');
const User = require('../models/User');

// Earnings reporting for the admin panel's Money screen. Payments are written
// by billingService (from the store APIs); this module stores and sums them.

const BUCKET_FORMATS = { day: '%Y-%m-%d', month: '%Y-%m', year: '%Y' };
// What the customer paid, less refunds.
const GROSS = { $subtract: ['$amount', { $ifNull: ['$refundedAmount', 0] }] };
const NET = { $ifNull: ['$net', 0] };

/** Inserts or refreshes payments (idempotent on the store's order id). */
async function upsertPayments(payments) {
  const ops = (payments || []).filter(Boolean).map((payment) => ({
    updateOne: {
      filter: { _id: payment._id },
      update: { $set: { ...payment, syncedAt: new Date() } },
      upsert: true,
    },
  }));
  if (ops.length === 0) return 0;
  await StorePayment.bulkWrite(ops, { ordered: false });
  return ops.length;
}

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

function parseDate(value, fallback) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : fallback;
}

function sumStage() {
  return {
    gross: { $sum: GROSS },
    net: { $sum: NET },
    tax: { $sum: { $ifNull: ['$tax', 0] } },
    count: { $sum: 1 },
    renewals: { $sum: { $cond: [{ $eq: ['$kind', 'renewal'] }, 1, 0] } },
    refunds: { $sum: { $cond: [{ $gt: ['$refundedAmount', 0] }, 1, 0] } },
    netEstimated: { $max: '$netEstimated' },
  };
}

function round(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function cleanTotals(row) {
  return {
    gross: round(row?.gross),
    net: round(row?.net),
    tax: round(row?.tax),
    count: row?.count || 0,
    renewals: row?.renewals || 0,
    refunds: row?.refunds || 0,
    netEstimated: Boolean(row?.netEstimated),
  };
}

async function sumSince(match, since) {
  if (!since) return null;
  const [row] = await StorePayment.aggregate([
    { $match: { ...match, purchasedAt: { $gte: since } } },
    { $group: { _id: null, ...sumStage() } },
  ]);
  return cleanTotals(row);
}

/**
 * Earnings for the Money screen.
 *  platform: all | android | ios
 *  granularity: day | month | year (chart buckets, in the viewer's time zone)
 *  from/to: range for the chart and totals
 *  currency: one currency at a time (stores pay in the buyer's currency)
 *  todayStart/monthStart/yearStart: the viewer's local period starts for the
 *  quick cards, independent of the chart range.
 */
async function getRevenue({
  platform = 'all',
  granularity = 'day',
  from,
  to,
  currency,
  includeTest = false,
  tz,
  todayStart,
  monthStart,
  yearStart,
} = {}) {
  const timezone = safeTimeZone(tz);
  const end = parseDate(to, new Date());
  const start = parseDate(from, new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000));
  const format = BUCKET_FORMATS[granularity] || BUCKET_FORMATS.day;

  const scope = { counted: true };
  if (!includeTest) scope.isTest = false;
  if (platform === 'android' || platform === 'ios') scope.platform = platform;
  const inRange = { ...scope, purchasedAt: { $gte: start, $lt: end } };

  const currencies = await StorePayment.aggregate([
    { $match: inRange },
    { $group: { _id: '$currency', count: { $sum: 1 }, gross: { $sum: GROSS } } },
    { $sort: { count: -1, _id: 1 } },
  ]);
  // Fall back to the most used currency overall when the range is empty.
  let selected = currencies.some((c) => c._id === currency) ? currency : currencies[0]?._id;
  if (!selected) {
    const [anyCurrency] = await StorePayment.aggregate([
      { $match: scope },
      { $group: { _id: '$currency', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);
    selected = currency || anyCurrency?._id || null;
  }

  const match = selected ? { ...inRange, currency: selected } : inRange;
  const quickScope = selected ? { ...scope, currency: selected } : scope;

  const [series, byPlatform, today, month, year, recent, subscribers, lastSync] = await Promise.all([
    StorePayment.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            bucket: { $dateToString: { format, date: '$purchasedAt', timezone } },
            platform: '$platform',
          },
          ...sumStage(),
        },
      },
      { $sort: { '_id.bucket': 1 } },
    ]),
    StorePayment.aggregate([
      { $match: match },
      { $group: { _id: '$platform', ...sumStage() } },
    ]),
    sumSince(quickScope, parseDate(todayStart, null)),
    sumSince(quickScope, parseDate(monthStart, null)),
    sumSince(quickScope, parseDate(yearStart, null)),
    StorePayment.find({ ...scope, purchasedAt: { $gte: start, $lt: end } })
      .sort({ purchasedAt: -1 })
      .limit(25)
      .lean(),
    User.aggregate([
      { $match: { storeProActive: true, proExpiryAt: { $gt: new Date() } } },
      {
        $group: {
          _id: '$proPlatform',
          count: { $sum: 1 },
          autoRenewing: { $sum: { $cond: ['$proAutoRenewing', 1, 0] } },
        },
      },
    ]),
    StorePayment.findOne({}).sort({ syncedAt: -1 }).select('syncedAt').lean(),
  ]);

  const recentUserIds = [...new Set(recent.map((p) => p.userId).filter(Boolean).map(String))];
  const users = recentUserIds.length
    ? await User.find({ _id: { $in: recentUserIds } }).select('name username').lean()
    : [];
  const usersById = new Map(users.map((u) => [u._id.toString(), u]));

  const platforms = { android: cleanTotals(null), ios: cleanTotals(null) };
  for (const row of byPlatform) {
    if (platforms[row._id]) platforms[row._id] = cleanTotals(row);
  }
  const total = cleanTotals(byPlatform.reduce((acc, row) => ({
    gross: acc.gross + row.gross,
    net: acc.net + row.net,
    tax: acc.tax + row.tax,
    count: acc.count + row.count,
    renewals: acc.renewals + row.renewals,
    refunds: acc.refunds + row.refunds,
    netEstimated: acc.netEstimated || row.netEstimated,
  }), { gross: 0, net: 0, tax: 0, count: 0, renewals: 0, refunds: 0, netEstimated: false }));

  const subs = { android: 0, ios: 0, autoRenewing: 0 };
  for (const row of subscribers) {
    if (row._id === 'android' || row._id === 'ios') subs[row._id] = row.count;
    subs.autoRenewing += row.autoRenewing;
  }

  return {
    currency: selected,
    currencies: currencies.map((c) => ({ currency: c._id, count: c.count, gross: round(c.gross) })),
    range: { from: start.toISOString(), to: end.toISOString(), granularity: BUCKET_FORMATS[granularity] ? granularity : 'day', timezone },
    total,
    platforms,
    quick: { today, month, year },
    series: series.map((row) => ({
      bucket: row._id.bucket,
      platform: row._id.platform,
      gross: round(row.gross),
      net: round(row.net),
      count: row.count,
    })),
    subscribers: subs,
    recent: recent.map((p) => ({
      id: p._id,
      platform: p.platform,
      kind: p.kind,
      purchasedAt: p.purchasedAt,
      currency: p.currency,
      amount: round(p.amount),
      refundedAmount: round(p.refundedAmount),
      net: p.net == null ? null : round(p.net),
      netEstimated: p.netEstimated,
      isTest: p.isTest,
      state: p.state,
      country: p.country,
      userId: p.userId ? String(p.userId) : null,
      userName: p.userId ? (usersById.get(String(p.userId))?.name || null) : null,
    })),
    lastSyncedAt: lastSync?.syncedAt || null,
  };
}

/** A user's payments, newest first (user detail page). */
async function paymentsForUser(userId, limit = 20) {
  const payments = await StorePayment.find({ userId }).sort({ purchasedAt: -1 }).limit(limit).lean();
  return payments.map((p) => ({
    id: p._id,
    platform: p.platform,
    kind: p.kind,
    purchasedAt: p.purchasedAt,
    currency: p.currency,
    amount: round(p.amount),
    refundedAmount: round(p.refundedAmount),
    net: p.net == null ? null : round(p.net),
    netEstimated: p.netEstimated,
    isTest: p.isTest,
    counted: p.counted,
    state: p.state,
  }));
}

/** Gross earnings per currency since `since` (overview card). */
async function totalsSince(since) {
  const rows = await StorePayment.aggregate([
    { $match: { counted: true, isTest: false, purchasedAt: { $gte: since } } },
    { $group: { _id: '$currency', gross: { $sum: GROSS }, net: { $sum: NET }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return rows.map((r) => ({ currency: r._id, gross: round(r.gross), net: round(r.net), count: r.count }));
}

module.exports = { upsertPayments, getRevenue, paymentsForUser, totalsSince };
