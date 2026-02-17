var request = require('superagent');

exports.Setup = Setup;
exports.Store = Store;
exports.CheckoutInvoice = require('./vendor/lib/checkoutInvoice');

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
 * Confirm a transaction by token without needing a full invoice.
 * @param {string} token Transaction token
 * @return {Promise}
 */
Setup.prototype.confirm = function (token) {
    if (!token) return Promise.reject(new Error('A transaction token is required.'));
    var self = this;
    return new Promise(function (resolve, reject) {
        request.get(self.baseURL + 'transactions/confirm/' + token)
            .set(self.config)
            .end(function (err, res) {
                if (err) return reject(err);
                var body = res.body;
                if (!body.error) {
                    resolve({
                        status: body.status,
                        customer: body.customer || null,
                        receiptURL: body.receipt_url || null,
                        customData: (body.custom_data && Object.keys(body.custom_data).length > 0) ? body.custom_data : null,
                        totalAmount: body.total_amount,
                        responseText: body.message != null ? body.message : ''
                    });
                } else {
                    var e = new Error('Could not confirm transaction.');
                    e.data = body;
                    reject(e);
                }
            });
    });
};

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
