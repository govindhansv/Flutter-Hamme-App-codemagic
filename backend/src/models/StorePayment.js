const mongoose = require('mongoose');

// One charge made by Google Play or the App Store: the first purchase and
// every renewal. Filled from the store APIs (Play Orders API, App Store
// transaction history), keyed by the store's own order/transaction id so
// re-syncing is idempotent. Amounts are in the buyer's currency.
const storePaymentSchema = new mongoose.Schema(
  {
    // `${platform}:${orderId}`
    _id: { type: String },
    platform: { type: String, enum: ['android', 'ios'], required: true },
    orderId: { type: String, required: true },
    // Play purchase token or Apple original transaction id.
    subscriptionId: { type: String, default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    productId: { type: String, default: null },
    kind: { type: String, enum: ['new', 'renewal'], default: 'new' },
    purchasedAt: { type: Date, required: true },
    currency: { type: String, required: true },
    // What the customer paid, including tax.
    amount: { type: Number, required: true },
    tax: { type: Number, default: null },
    // Amount refunded to the customer so far.
    refundedAmount: { type: Number, default: 0 },
    // Your share after the store fee and tax. Exact for Google Play;
    // estimated for the App Store (see netEstimated).
    net: { type: Number, default: null },
    netEstimated: { type: Boolean, default: false },
    // False for orders that never charged the customer (canceled/pending).
    counted: { type: Boolean, default: true },
    isTest: { type: Boolean, default: false },
    state: { type: String, default: null },
    country: { type: String, default: null },
    syncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

storePaymentSchema.index({ purchasedAt: -1 });
storePaymentSchema.index({ userId: 1, purchasedAt: -1 });

module.exports = mongoose.model('StorePayment', storePaymentSchema);
