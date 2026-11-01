const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

function fixture({ platform = 'android', active = true, old = true, admin = false, attributed = 'old', failSave = false, subscriptionState, storeFailure } = {}) {
  let users = new Map();
  let bindings = new Map();
  const token = platform === 'ios' ? 'apple-original' : 'play-token';
  if (old) users.set('old', { id: 'old', _id: 'old', proPurchaseToken: token, isPro: true, storeProActive: true, adminPro: admin });
  users.set('new', { id: 'new', _id: 'new', isPro: false });
  const query = (get, many = false) => {
    let session;
    const doc = (data) => data && {
      ...data,
      $session: () => session,
      save: async function () {
        if (failSave && this.id === 'new') throw new Error('Injected database failure');
        const saved = { ...this }; delete saved.save; delete saved.$session;
        users.set(this.id, saved);
      },
    };
    const q = {
      select: () => q, session: (s) => { session = s; return q; }, lean: () => q,
      then: (resolve, reject) => Promise.resolve().then(() => {
        const value = get(); return many ? value.map(doc) : doc(value);
      }).then(resolve, reject),
    };
    return q;
  };
  const User = {
    findById: (id) => query(() => users.get(id)),
    findOne: (filter) => query(() => [...users.values()].find(u => u.proPurchaseToken === filter.proPurchaseToken)),
    find: (filter) => query(() => [...users.values()].filter(u => filter.proPurchaseToken.$in.includes(u.proPurchaseToken)), true),
    collection: { createIndex: async () => {}, dropIndex: async () => {} },
  };
  const Ownership = {
    init: async () => {},
    findById: (id) => query(() => bindings.get(id)),
    findOneAndUpdate: async (filter, update) => bindings.set(filter._id, { userId: update.$set.userId }),
  };
  const raw = {
    subscriptionState: subscriptionState || (active ? 'SUBSCRIPTION_STATE_ACTIVE' : 'SUBSCRIPTION_STATE_EXPIRED'),
    lineItems: [{ productId: 'hamme_pro_weekly', expiryTime: new Date(Date.now() + (active ? 86400000 : -86400000)).toISOString() }],
    externalAccountIdentifiers: { obfuscatedExternalAccountId: attributed },
  };
  const signed = (value) => `header.${Buffer.from(JSON.stringify(value)).toString('base64url')}.signature`;
  const appleTransaction = { transactionId: 'apple-tx', originalTransactionId: 'apple-original', productId: 'hamme_pro_weekly', expiresDate: Date.now() + (active ? 86400000 : -86400000), environment: 'Sandbox' };
  const ApiError = require('../src/utils/ApiError');
  const sandbox = {
    module: { exports: {} }, Buffer, Date, Set, Map, console, __dirname: path.resolve(__dirname, '../src/services'),
    process: { env: { GOOGLE_PLAY_SERVICE_ACCOUNT_JSON: '{}', ANDROID_PACKAGE_NAME: 'com.hamme.app' } },
    require: (name) => {
      if (name === '../models/User') return User;
      if (name === '../models/BillingOwnership') return Ownership;
      if (name === '../utils/ApiError') return ApiError;
      if (name === '../utils/logger') return { warn() {}, info() {}, error() {} };
      if (name === './revenueService') return { upsertPayments: async (payments) => payments.length };
      if (name === '../config/env') return { appleIapPrivateKeyBase64: Buffer.from('-----BEGIN PRIVATE KEY-----').toString('base64'), appleIapIssuerId: 'issuer', appleIapKeyId: 'key', appleIapBundleId: 'com.hamme.app' };
      if (name === 'mongoose') return {
        isValidObjectId: () => false,
        startSession: async () => ({
          withTransaction: async (fn) => {
            const beforeUsers = structuredClone(users); const beforeBindings = structuredClone(bindings);
            try { return await fn(); } catch (e) { users = beforeUsers; bindings = beforeBindings; throw e; }
          }, endSession: async () => {},
        }),
      };
      if (name === '@googleapis/androidpublisher') return {
        auth: { GoogleAuth: class { async getClient() { return {}; } } },
        androidpublisher: () => ({ purchases: { subscriptionsv2: { get: async () => { if (storeFailure) throw storeFailure; return { data: raw }; } } } }),
      };
      if (name === '@apple/app-store-server-library') return {
        Environment: { PRODUCTION: 'Production', SANDBOX: 'Sandbox' }, Status: { ACTIVE: 1, BILLING_GRACE_PERIOD: 4 },
        SignedDataVerifier: class { async verifyAndDecodeTransaction(value) {
          if (value !== signed(appleTransaction)) throw new Error('invalid signature');
          return appleTransaction;
        } },
        ReceiptUtility: class {},
        AppStoreServerAPIClient: class { async getAllSubscriptionStatuses() {
          return { bundleId: 'com.hamme.app', data: [{ lastTransactions: [{ status: active ? 1 : 2, originalTransactionId: 'apple-original', signedTransactionInfo: signed(appleTransaction) }] }] };
        } },
      };
      return require(name);
    },
  };
  vm.runInNewContext(fs.readFileSync(path.resolve(__dirname, '../src/services/billingService.js'), 'utf8'), sandbox);
  return {
    service: sandbox.module.exports,
    users: () => users,
    payload: { platform, productId: 'hamme_pro_weekly', purchaseToken: platform === 'ios' ? signed(appleTransaction) : token },
  };
}

for (const subscriptionState of ['SUBSCRIPTION_STATE_PENDING', 'SUBSCRIPTION_STATE_ON_HOLD', 'SUBSCRIPTION_STATE_PAUSED', 'SUBSCRIPTION_STATE_EXPIRED', 'SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED']) {
  test(`Google ${subscriptionState} never grants Pro even with a future expiry`, async () => {
    const f = fixture({ old: false, attributed: 'new', subscriptionState });
    await assert.rejects(f.service.verifyPurchase('new', f.payload), e => e.statusCode === 402);
    assert.equal(f.users().get('new').isPro, false);
  });
}
for (const subscriptionState of ['SUBSCRIPTION_STATE_CANCELED', 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD']) {
  test(`Google ${subscriptionState} keeps access for the paid period`, async () => {
    const f = fixture({ old: false, attributed: 'new', subscriptionState });
    assert.equal((await f.service.verifyPurchase('new', f.payload)).isPro, true);
  });
}
test('Google verification outage does not grant or mutate ownership', async () => {
  const f = fixture({ storeFailure: Object.assign(new Error('Unavailable'), { code: 503 }) });
  await assert.rejects(f.service.verifyPurchase('new', f.payload), e => e.statusCode === 503);
  assert.equal(f.users().get('new').isPro, false);
  assert.equal(f.users().get('old').isPro, true);
});

for (const platform of ['android', 'ios']) {
  test(`${platform}: linking another profile requires confirmation and makes no changes`, async () => {
    const f = fixture({ platform });
    await assert.rejects(f.service.restorePurchase('new', f.payload), e => e.statusCode === 409 && e.details.code === 'RESTORE_REQUIRED');
    assert.equal(f.users().get('old').isPro, true);
    assert.equal(f.users().get('new').isPro, false);
  });
  test(`${platform}: confirmed restore moves Pro without logging in to the old profile`, async () => {
    const f = fixture({ platform });
    const user = await f.service.restorePurchase('new', { ...f.payload, confirmTransfer: true });
    assert.equal(user.id, 'new'); assert.equal(user.isPro, true);
    assert.equal(f.users().get('old').isPro, false);
    assert.equal(f.users().get('old').proPurchaseToken, null);
    assert.equal('accessToken' in user, false);
    const repeated = await f.service.restorePurchase('new', f.payload);
    assert.equal(repeated.isPro, true);
  });
  test(`${platform}: deleted original profile does not prevent restoring Pro`, async () => {
    const f = fixture({ platform, old: false });
    const user = await f.service.restorePurchase('new', { ...f.payload, confirmTransfer: true });
    assert.equal(user.isPro, true);
  });
  test(`${platform}: expired subscriptions cannot transfer`, async () => {
    const f = fixture({ platform, active: false });
    await assert.rejects(f.service.restorePurchase('new', { ...f.payload, confirmTransfer: true }), e => e.statusCode === 402);
    assert.equal(f.users().get('new').isPro, false);
  });
}
test('transfer preserves old profile admin Pro', async () => {
  const f = fixture({ admin: true });
  await f.service.restorePurchase('new', { ...f.payload, confirmTransfer: true });
  assert.equal(f.users().get('old').isPro, true);
  assert.equal(f.users().get('old').storeProActive, false);
});
test('Apple rejects forged client transaction data before linking', async () => {
  const f = fixture({ platform: 'ios' });
  await assert.rejects(f.service.restorePurchase('new', { ...f.payload, purchaseToken: f.payload.purchaseToken + 'forged', confirmTransfer: true }), e => e.statusCode === 402);
  assert.equal(f.users().get('new').isPro, false);
});

test('fresh purchase verification returns the committed Pro entitlement', async () => {
  const f = fixture({ old: false, attributed: 'new' });
  const user = await f.service.verifyPurchase('new', f.payload);
  assert.equal(user.id, 'new');
  assert.equal(user.isPro, true);
  assert.equal(f.users().get('new').isPro, true);
});
test('database failure rolls back revocation and the new profile grant', async () => {
  const f = fixture({ failSave: true });
  await assert.rejects(f.service.restorePurchase('new', { ...f.payload, confirmTransfer: true }), /Injected database failure/);
  assert.equal(f.users().get('old').isPro, true);
  assert.equal(f.users().get('old').proPurchaseToken, 'play-token');
  assert.equal(f.users().get('new').isPro, false);
});

test('Apple status reconciliation accepts the stored original transaction ID', async () => {
  const f = fixture({ platform: 'ios' });
  await f.service.restorePurchase('new', { ...f.payload, confirmTransfer: true });
  f.users().get('new').proLastVerifiedAt = null;
  const user = await f.service.syncUserSubscription('new');
  assert.equal(user.isPro, true);
  assert.equal(user.proPurchaseToken, 'apple-original');
});

test('delayed Google notification cannot revive old attribution after token replacement', async () => {
  const f = fixture();
  await f.service.restorePurchase('new', { ...f.payload, confirmTransfer: true });
  f.users().get('new').proPurchaseToken = 'newer-play-token';
  const data = Buffer.from(JSON.stringify({
    packageName: 'com.hamme.app',
    subscriptionNotification: { purchaseToken: 'play-token' },
  })).toString('base64');
  const result = await f.service.processRtdn({ message: { data } });
  assert.equal(result.ignored, true);
  assert.equal(f.users().get('old').isPro, false);
  assert.equal(f.users().get('new').proPurchaseToken, 'newer-play-token');
});

test('Play renewal order ids expand to every order of the subscription', () => {
  const { service } = fixture();
  assert.deepEqual([...service.expandPlayOrderIds('GPA.1111-2222-3333-44444')], ['GPA.1111-2222-3333-44444']);
  assert.deepEqual([...service.expandPlayOrderIds('GPA.1111-2222-3333-44444..2')], [
    'GPA.1111-2222-3333-44444',
    'GPA.1111-2222-3333-44444..0',
    'GPA.1111-2222-3333-44444..1',
    'GPA.1111-2222-3333-44444..2',
  ]);
  assert.deepEqual([...service.expandPlayOrderIds(null)], []);
});

test('Play orders become ledger payments with refunds and Google net revenue', () => {
  const { service } = fixture();
  const money = (units, nanos = 0) => ({ currencyCode: 'INR', units: String(units), nanos });
  const renewal = service.playPaymentFromOrder({
    orderId: 'GPA.1..3', state: 'PROCESSED', createTime: '2026-10-01T10:00:00Z',
    total: money(429), tax: money(65, 440000000), developerRevenueInBuyerCurrency: money(310, 500000000),
    lineItems: [{ productId: 'hamme_pro_weekly' }], buyerAddress: { buyerCountry: 'IN' },
  }, { purchaseToken: 'tok', userId: 'u1', isTest: false });
  assert.equal(renewal._id, 'android:GPA.1..3');
  assert.equal(renewal.kind, 'renewal');
  assert.equal(renewal.amount, 429);
  assert.equal(renewal.tax, 65.44);
  assert.equal(renewal.net, 310.5);
  assert.equal(renewal.counted, true);
  assert.equal(renewal.country, 'IN');

  const refunded = service.playPaymentFromOrder({
    orderId: 'GPA.1', state: 'REFUNDED', createTime: '2026-10-01T10:00:00Z',
    total: money(429), developerRevenueInBuyerCurrency: money(310),
  }, { purchaseToken: 'tok', userId: 'u1', isTest: true });
  assert.equal(refunded.kind, 'new');
  assert.equal(refunded.refundedAmount, 429);
  assert.equal(refunded.net, 0);
  assert.equal(refunded.isTest, true);

  const canceled = service.playPaymentFromOrder({
    orderId: 'GPA.2', state: 'CANCELED', total: money(429),
  }, { purchaseToken: 'tok' });
  assert.equal(canceled.counted, false);
});

test('App Store transactions become ledger payments with an estimated net', () => {
  const { service } = fixture();
  const payment = service.applePaymentFromTransaction({
    transactionId: '2000001', originalTransactionId: '2000000', productId: 'hamme_pro_weekly',
    price: 4990, currency: 'USD', purchaseDate: Date.parse('2026-10-02T00:00:00Z'),
    transactionReason: 'RENEWAL', environment: 'Production', storefront: 'USA',
  }, 'u1');
  assert.equal(payment._id, 'ios:2000001');
  assert.equal(payment.amount, 4.99);
  assert.equal(payment.net, 4.24);
  assert.equal(payment.netEstimated, true);
  assert.equal(payment.kind, 'renewal');
  assert.equal(payment.isTest, false);

  const revoked = service.applePaymentFromTransaction({
    transactionId: '2000002', price: 4990, currency: 'USD', purchaseDate: Date.now(),
    revocationDate: Date.now(), environment: 'Sandbox',
  }, 'u1');
  assert.equal(revoked.refundedAmount, 4.99);
  assert.equal(revoked.net, 0);
  assert.equal(revoked.isTest, true);
});
