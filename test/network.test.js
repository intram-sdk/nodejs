var assert = require('assert');
var nock = require('nock');
var intram = require('../');
var DirectPay = require('../vendor/lib/direct-pay');
var OnsiteInvoice = require('../vendor/lib/onsite-invoice');

var BASE = 'https://webservices.intram.org:4002';

function makeSetup() {
    return new intram.Setup({
        marchandKey: 'm-key',
        privateKey: 'priv-key',
        publicKey: 'pub-key',
        secret: 'secret-key'
    });
}

function makeStore() {
    return new intram.Store({ name: 'My Shop' });
}

beforeEach(function () {
    nock.disableNetConnect();
});

afterEach(function () {
    nock.cleanAll();
    nock.enableNetConnect();
});

describe('Setup (no network)', function () {
    it('accepts mode "sandbox" but keeps the same base URL (documented no-op)', function () {
        var live = new intram.Setup().baseURL;
        var sandbox = new intram.Setup({ mode: 'sandbox' }).baseURL;
        assert.strictEqual(sandbox, live);
    });
});

describe('Setup.confirm', function () {
    it('resolves a mapped result on success', function () {
        nock(BASE).get(/\/transactions\/confirm\/tok-1$/).reply(200, {
            error: false,
            status: 'SUCCESS',
            customer: { name: 'Ada', phone: '229', email: 'a@b.co' },
            receipt_url: 'https://r/1',
            custom_data: { orderId: 'A-1' },
            total_amount: 5000,
            message: 'ok'
        });
        return makeSetup().confirm('tok-1').then(function (r) {
            assert.strictEqual(r.status, 'SUCCESS');
            assert.strictEqual(r.customer.name, 'Ada');
            assert.strictEqual(r.receiptURL, 'https://r/1');
            assert.strictEqual(r.customData.orderId, 'A-1');
            assert.strictEqual(r.totalAmount, 5000);
            assert.strictEqual(r.responseText, 'ok');
        });
    });

    it('nulls optional fields and empties responseText when absent', function () {
        nock(BASE).get(/\/transactions\/confirm\/tok-2$/).reply(200, {
            error: false,
            status: 'PENDING',
            custom_data: {},
            total_amount: 0
        });
        return makeSetup().confirm('tok-2').then(function (r) {
            assert.strictEqual(r.status, 'PENDING');
            assert.strictEqual(r.customer, null);
            assert.strictEqual(r.receiptURL, null);
            assert.strictEqual(r.customData, null);
            assert.strictEqual(r.responseText, '');
        });
    });

    it('rejects when the API returns an error body', function () {
        nock(BASE).get(/\/transactions\/confirm\/bad$/).reply(200, { error: true, message: 'nope' });
        return makeSetup().confirm('bad').then(
            function () { throw new Error('expected rejection'); },
            function (err) {
                assert.ok(err instanceof Error);
                assert.strictEqual(err.data.message, 'nope');
            }
        );
    });

    it('rejects on a transport/network error', function () {
        nock(BASE).get(/\/transactions\/confirm\/boom$/).replyWithError('socket hang up');
        return makeSetup().confirm('boom').then(
            function () { throw new Error('expected rejection'); },
            function (err) { assert.ok(err instanceof Error); }
        );
    });
});

describe('CheckoutInvoice.confirm', function () {
    function makeInvoice() {
        return new intram.CheckoutInvoice(makeSetup(), makeStore());
    }

    it('maps SUCCESS fields onto the instance', function () {
        nock(BASE).get(/\/transactions\/confirm\/inv-1$/).reply(200, {
            error: false,
            status: 'SUCCESS',
            customer: { name: 'Ada' },
            receipt_url: 'https://r/ok',
            custom_data: { k: 'v' },
            total_amount: 1200,
            message: 'done'
        });
        var inv = makeInvoice();
        return inv.confirm('inv-1').then(function () {
            assert.strictEqual(inv.status, 'SUCCESS');
            assert.strictEqual(inv.responseText, 'done');
            assert.strictEqual(inv.receiptURL, 'https://r/ok');
            assert.strictEqual(inv.customData.k, 'v');
            assert.strictEqual(inv.totalAmount, 1200);
        });
    });

    it('rejects when the API returns an error body', function () {
        nock(BASE).get(/\/transactions\/confirm\/inv-bad$/).reply(200, { error: true });
        return makeInvoice().confirm('inv-bad').then(
            function () { throw new Error('expected rejection'); },
            function (err) { assert.ok(err instanceof Error); }
        );
    });
});

describe('CheckoutInvoice.create', function () {
    function readyInvoice() {
        var inv = new intram.CheckoutInvoice(makeSetup(), makeStore());
        inv.totalAmount = 1000;
        inv.currency = 'XOF';
        inv.addItem('Item', 1, 1000, 1000);
        return inv;
    }

    it('posts the invoice then resolves via confirm on success', function () {
        nock(BASE).post(/\/payments\/request$/).reply(200, {
            error: false,
            transaction_id: 'txn-9',
            receipt_url: 'https://r/9',
            status: 'PENDING'
        });
        nock(BASE).get(/\/transactions\/confirm\/txn-9$/).reply(200, {
            error: false, status: 'SUCCESS', total_amount: 1000
        });
        var inv = readyInvoice();
        return inv.create().then(function () {
            assert.strictEqual(inv.token, 'txn-9');
            assert.strictEqual(inv.url, 'https://r/9');
            assert.strictEqual(inv.status, 'SUCCESS'); // updated by confirm()
        });
    });

    it('rejects when invoice creation fails', function () {
        nock(BASE).post(/\/payments\/request$/).reply(200, { error: true, message: 'bad request' });
        return readyInvoice().create().then(
            function () { throw new Error('expected rejection'); },
            function (err) {
                assert.ok(err instanceof Error);
                assert.strictEqual(err.data.message, 'bad request');
            }
        );
    });
});

describe('DirectPay', function () {
    it('throws without a Setup instance', function () {
        assert.throws(function () { new DirectPay(); });
        assert.throws(function () { new DirectPay({}); });
    });

    it('resolves and stores fields when response_code is "00"', function () {
        nock(BASE).post(/\/direct-pay\/credit-account$/).reply(200, {
            response_code: '00',
            response_text: 'credited',
            description: 'ok',
            transaction_id: 'dp-1'
        });
        var dp = new DirectPay(makeSetup());
        return dp.creditAccount('user@x.co', 2500).then(function () {
            assert.strictEqual(dp.responseText, 'credited');
            assert.strictEqual(dp.transactionID, 'dp-1');
        });
    });

    it('rejects when response_code is not "00"', function () {
        nock(BASE).post(/\/direct-pay\/credit-account$/).reply(200, { response_code: '01' });
        var dp = new DirectPay(makeSetup());
        return dp.creditAccount('user@x.co', 2500).then(
            function () { throw new Error('expected rejection'); },
            function (err) { assert.ok(err instanceof Error); }
        );
    });
});

describe('OnsiteInvoice', function () {
    function readyOnsite() {
        var o = new OnsiteInvoice(makeSetup(), makeStore());
        o.totalAmount = 1000;
        o.currency = 'XOF';
        o.addItem('Item', 1, 1000, 1000);
        return o;
    }

    it('appends /opr to the base URL', function () {
        var o = new OnsiteInvoice(makeSetup(), makeStore());
        assert.ok(/\/opr$/.test(o.baseURL));
    });

    it('create() resolves with tokens on success', function () {
        nock(BASE).post(/\/opr\/create$/).reply(200, {
            response_code: '00',
            invoice_token: 'inv-tok',
            token: 'opr-tok',
            description: 'created'
        });
        var o = readyOnsite();
        return o.create('user@x.co').then(function () {
            assert.strictEqual(o.token, 'inv-tok');
            assert.strictEqual(o.oprToken, 'opr-tok');
        });
    });

    it('charge() resolves and maps invoice_data on success', function () {
        nock(BASE).post(/\/opr\/charge$/).reply(200, {
            response_code: '00',
            response_text: 'charged',
            invoice_data: { status: 'SUCCESS', receipt_url: 'https://r/c', customer: { name: 'Ada' } }
        });
        var o = readyOnsite();
        return o.charge('opr-tok', '1234').then(function () {
            assert.strictEqual(o.status, 'SUCCESS');
            assert.strictEqual(o.receiptURL, 'https://r/c');
            assert.strictEqual(o.customer.name, 'Ada');
        });
    });

    it('charge() rejects when response_code is not "00"', function () {
        nock(BASE).post(/\/opr\/charge$/).reply(200, { response_code: '99' });
        var o = readyOnsite();
        return o.charge('opr-tok', '0000').then(
            function () { throw new Error('expected rejection'); },
            function (err) { assert.ok(err instanceof Error); }
        );
    });
});
