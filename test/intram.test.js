var assert = require('assert');
var intram = require('../');

describe('Setup', function () {
    afterEach(function () {
        delete process.env.INTRAM_MARCHAND_KEY;
        delete process.env.INTRAM_PRIVATE_KEY;
        delete process.env.INTRAM_PUBLIC_KEY;
        delete process.env.INTRAM_SECRET;
    });

    it('maps provided credentials into config headers', function () {
        var setup = new intram.Setup({
            marchandKey: 'm-key',
            privateKey: 'priv-key',
            publicKey: 'pub-key',
            secret: 'secret-key'
        });
        assert.strictEqual(setup.config['X-MARCHAND-KEY'], 'm-key');
        assert.strictEqual(setup.config['X-PRIVATE-KEY'], 'priv-key');
        assert.strictEqual(setup.config['X-API-KEY'], 'pub-key');
        assert.strictEqual(setup.config['X-SECRET-KEY'], 'secret-key');
        assert.strictEqual(setup.config['Content-Type'], 'application/json');
    });

    it('falls back to environment variables when no data is given', function () {
        process.env.INTRAM_MARCHAND_KEY = 'env-m';
        process.env.INTRAM_PRIVATE_KEY = 'env-priv';
        process.env.INTRAM_PUBLIC_KEY = 'env-pub';
        process.env.INTRAM_SECRET = 'env-secret';
        var setup = new intram.Setup();
        assert.strictEqual(setup.config['X-MARCHAND-KEY'], 'env-m');
        assert.strictEqual(setup.config['X-PRIVATE-KEY'], 'env-priv');
        assert.strictEqual(setup.config['X-API-KEY'], 'env-pub');
        assert.strictEqual(setup.config['X-SECRET-KEY'], 'env-secret');
    });

    it('exposes the INTRAM webservices base URL', function () {
        var setup = new intram.Setup();
        assert.ok(/^https:\/\/webservices\.intram\.org/.test(setup.baseURL));
    });

    it('confirm() rejects when no token is provided', function () {
        var setup = new intram.Setup();
        return setup.confirm().then(
            function () { throw new Error('expected confirm() to reject'); },
            function (err) { assert.ok(err instanceof Error); }
        );
    });
});

describe('Store', function () {
    it('throws when required name is missing', function () {
        assert.throws(function () { new intram.Store(); });
        assert.throws(function () { new intram.Store({}); });
    });

    it('initializes when a name is provided', function () {
        assert.doesNotThrow(function () { new intram.Store({ name: 'My Shop' }); });
    });

    it('maps optional fields to their API keys', function () {
        var data = {
            name: 'landryShop',
            tagline: "L'elegance n'a pas de prix",
            phoneNumber: '22967723243',
            postalAddress: 'Benin Abomey Calavi',
            color: '#2563eb',
            logo_url: 'https://example.com/logo.png',
            website_url: 'http://example.com',
            template: 'default',
            cancelURL: 'http://example.com/cancel',
            returnURL: 'http://example.com/return',
            callbackURL: 'http://example.com/callback'
        };
        var store = new intram.Store(data);
        assert.strictEqual(store.name, data.name);
        assert.strictEqual(store.tagline, data.tagline);
        assert.strictEqual(store.phone_number, data.phoneNumber);
        assert.strictEqual(store.postal_address, data.postalAddress);
        assert.strictEqual(store.logo_url, data.logo_url);
        assert.strictEqual(store.website_url, data.website_url);
        assert.strictEqual(store.color, data.color);
        assert.strictEqual(store.template, data.template);
        assert.strictEqual(store.cancel_url, data.cancelURL);
        assert.strictEqual(store.return_url, data.returnURL);
        assert.strictEqual(store.callback_url, data.callbackURL);
    });
});

describe('CheckoutInvoice', function () {
    function makeInvoice() {
        var setup = new intram.Setup({
            marchandKey: 'm-key',
            privateKey: 'priv-key',
            publicKey: 'pub-key',
            secret: 'secret-key'
        });
        var store = new intram.Store({ name: 'My Shop' });
        return new intram.CheckoutInvoice(setup, store);
    }

    it('throws when built without valid setup and store', function () {
        assert.throws(function () { new intram.CheckoutInvoice(); });
    });

    it('builds from valid setup and store instances', function () {
        var invoice = makeInvoice();
        assert.strictEqual(invoice.store.name, 'My Shop');
        assert.strictEqual(invoice.totalAmount, 0);
        assert.strictEqual(typeof invoice.confirm, 'function');
        assert.strictEqual(typeof invoice.create, 'function');
    });

    it('accumulates items via addItem', function () {
        var invoice = makeInvoice();
        invoice.addItem('Shoes', 2, 5000, 10000, 'Running shoes');
        assert.strictEqual(Object.keys(invoice.items).length, 1);
        assert.strictEqual(invoice.items.item_1.name, 'Shoes');
        assert.strictEqual(invoice.items.item_1.quantity, 2);
        assert.throws(function () { invoice.addItem(); });
    });

    it('generateRequestBody requires amount and currency', function () {
        var invoice = makeInvoice();
        assert.throws(function () { invoice.generateRequestBody(); });

        invoice.totalAmount = 10000;
        invoice.currency = 'XOF';
        invoice.addItem('Shoes', 1, 10000, 10000);
        var body = invoice.generateRequestBody();
        assert.strictEqual(body.invoice.amount, 10000);
        assert.strictEqual(body.invoice.currency, 'XOF');
        assert.strictEqual(body.store.name, 'My Shop');
        assert.ok(body.invoice.items.item_1);
    });
});
