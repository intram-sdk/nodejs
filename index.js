exports.Setup = exports.setup = Setup;
exports.Store = exports.store = Store;
exports.CheckoutInvoice = exports.checkoutInvoice = require('./vendor/lib/checkoutInvoice');
// exports.OnsiteInvoice = exports.onsiteInvoice = require('./vendor/lib/onsite-invoice');
// exports.DirectPay = exports.directPay = require('./vendor/lib/direct-pay');

/**
 * Setup INTRAM
 * @param {object} data
 */
function Setup(data) {
    this.config = {}
    this.config['X-MARCHAND-KEY'] = data && data.marchandKey || process.env.INTRAM_MARCHAND_KEY;
    this.config['X-PRIVATE-KEY'] = data && data.privateKey || process.env.INTRAM_PRIVATE_KEY;
     this.config['X-API-KEY'] = data && data.publicKey || process.env.INTRAM_PUBLIC_KEY;
    this.config['X-SECRET-KEY'] = data && data.secret || process.env.INTRAM_SECRET;
    this.config['Content-Type'] = 'application/json';
    if (data && data.mode && data.mode.toLowerCase() === 'sandbox')
        this.baseURL = 'https://webservices.intram.org:4002/api/v1/';
    else
        this.baseURL = 'https://webservices.intram.org:4002/api/v1/';
}

/**
 * Setup merchant store
 * @param {object} data
 */
function Store(data) {
    if (!(data && data.name))
        throw new Error('Invalid parameters.');
    this.name = data.name;
    if (data.tagline) this.tagline = data.tagline;
    if (data.phoneNumber) this.phone_number = data.phoneNumber;
    if (data.postalAddress) this.postal_address = data.postalAddress;
    if (data.logo_url) this.logo_url = data.logo_url;
    if (data.website_url) this.website_url = data.website_url;
    if (data.color) this.color = data.color;
    if (data.template) this.template = data.template;
    if (data.cancelURL) this.cancel_url = data.cancelURL;
    if (data.returnURL) this.return_url = data.returnURL;
    if (data.callbackURL) this.callback_url = data.callbackURL;
}