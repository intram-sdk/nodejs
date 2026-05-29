var assert = require('assert');
var intram = require('../');

function makeInvoice(storeData) {
    var setup = new intram.Setup({
        marchandKey: 'm-key',
        privateKey: 'priv-key',
        publicKey: 'pub-key',
        secret: 'secret-key'
    });
    var store = new intram.Store(storeData || { name: 'My Shop' });
    return new intram.CheckoutInvoice(setup, store);
}

describe('Invoice.addItem', function () {
    it('increments item positions for each call', function () {
        var inv = makeInvoice();
        inv.addItem('A', 1, 100, 100);
        inv.addItem('B', 2, 200, 400);
        assert.strictEqual(Object.keys(inv.items).length, 2);
        assert.strictEqual(inv.items.item_1.name, 'A');
        assert.strictEqual(inv.items.item_2.name, 'B');
        assert.strictEqual(inv.items.item_2.total_price, 400);
    });

    it('defaults numeric fields to 0 when omitted', function () {
        var inv = makeInvoice();
        inv.addItem('NoNumbers');
        assert.strictEqual(inv.items.item_1.quantity, 0);
        assert.strictEqual(inv.items.item_1.unit_price, 0);
        assert.strictEqual(inv.items.item_1.total_price, 0);
        assert.strictEqual(inv.items.item_1.description, undefined);
    });

    it('stores the description only when provided', function () {
        var inv = makeInvoice();
        inv.addItem('WithDesc', 1, 10, 10, 'hello');
        assert.strictEqual(inv.items.item_1.description, 'hello');
    });

    it('throws when name is missing', function () {
        var inv = makeInvoice();
        assert.throws(function () { inv.addItem(); });
        assert.throws(function () { inv.addItem(''); });
    });
});

describe('Invoice.addTax', function () {
    it('adds taxes with numeric amounts and increments position', function () {
        var inv = makeInvoice();
        inv.addTax('TVA', 18);
        inv.addTax('Stamp', '5');
        assert.strictEqual(inv.taxes.tax_1.name, 'TVA');
        assert.strictEqual(inv.taxes.tax_1.amount, 18);
        assert.strictEqual(inv.taxes.tax_2.amount, 5);
    });

    it('throws when the name is not a string', function () {
        var inv = makeInvoice();
        assert.throws(function () { inv.addTax(); });
        assert.throws(function () { inv.addTax(42, 10); });
    });
});

describe('Invoice.addChannel / addChannels', function () {
    it('pushes a single channel', function () {
        var inv = makeInvoice();
        inv.addChannel('card');
        inv.addChannel('momo');
        assert.deepStrictEqual(inv.channels, ['card', 'momo']);
    });

    it('throws on a non-string channel', function () {
        var inv = makeInvoice();
        assert.throws(function () { inv.addChannel(); });
        assert.throws(function () { inv.addChannel(123); });
    });

    it('replaces the channel list with addChannels', function () {
        var inv = makeInvoice();
        inv.addChannel('old');
        inv.addChannels(['card', 'bank']);
        assert.deepStrictEqual(inv.channels, ['card', 'bank']);
    });

    it('throws when addChannels is not given an array', function () {
        var inv = makeInvoice();
        assert.throws(function () { inv.addChannels(); });
        assert.throws(function () { inv.addChannels('card'); });
    });
});

describe('Invoice.addCustomData', function () {
    it('stores key/value pairs', function () {
        var inv = makeInvoice();
        inv.addCustomData('orderId', 'A-123');
        assert.strictEqual(inv.customData.orderId, 'A-123');
    });

    it('throws when key or value is missing', function () {
        var inv = makeInvoice();
        assert.throws(function () { inv.addCustomData('k'); });
        assert.throws(function () { inv.addCustomData(); });
    });
});

describe('Invoice.generateRequestBody', function () {
    it('throws until amount and currency are set', function () {
        var inv = makeInvoice();
        assert.throws(function () { inv.generateRequestBody(); });
        inv.totalAmount = 1000;
        assert.throws(function () { inv.generateRequestBody(); }); // currency still missing
    });

    it('includes every optional section when populated', function () {
        var inv = makeInvoice({
            name: 'My Shop',
            returnURL: 'https://x/return',
            cancelURL: 'https://x/cancel',
            callbackURL: 'https://x/callback'
        });
        inv.totalAmount = 5000;
        inv.currency = 'XOF';
        inv.description = 'Order #1';
        inv.addItem('Shoes', 1, 5000, 5000);
        inv.addTax('TVA', 18);
        inv.addChannels(['card']);
        inv.addCustomData('orderId', 'A-1');

        var body = inv.generateRequestBody();
        assert.strictEqual(body.invoice.amount, 5000);
        assert.strictEqual(body.invoice.currency, 'XOF');
        assert.strictEqual(body.invoice.description, 'Order #1');
        assert.ok(body.invoice.items.item_1);
        assert.ok(body.invoice.taxes.tax_1);
        assert.deepStrictEqual(body.invoice.channels, ['card']);
        assert.strictEqual(body.custom_data.orderId, 'A-1');
        assert.strictEqual(body.actions.return_url, 'https://x/return');
        assert.strictEqual(body.actions.cancel_url, 'https://x/cancel');
        assert.strictEqual(body.actions.callback_url, 'https://x/callback');
        assert.strictEqual(body.store.name, 'My Shop');
    });

    it('omits optional sections when empty', function () {
        var inv = makeInvoice();
        inv.totalAmount = 100;
        inv.currency = 'XOF';
        var body = inv.generateRequestBody();
        assert.strictEqual(body.invoice.items, undefined);
        assert.strictEqual(body.invoice.taxes, undefined);
        assert.strictEqual(body.invoice.channels, undefined);
        assert.strictEqual(body.custom_data, undefined);
        assert.strictEqual(body.actions, undefined);
        assert.strictEqual(body.invoice.description, undefined);
    });
});
