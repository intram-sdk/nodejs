let Invoice = require('./invoice')
    , request = require('superagent')
;

// Inherit invoice
OnsiteInvoice.prototype = Object.create(Invoice.prototype);
OnsiteInvoice.prototype.constructor = OnsiteInvoice;

/**
 * OnsiteInvoice class
 * @param {object} setup Instance of intram.Setup
 * @param {object} store Instance of intram.Store
 */
function OnsiteInvoice(setup, store) {
    Invoice.call(this, setup, store); // call Invoice initializer
    this.baseURL = this.baseURL + '/opr';
};

/**
 * Create an invoice
 * @param  {string} customer Account alias, number or username
 * @return {promise}
 */
OnsiteInvoice.prototype.create = function (customer) {
    let self = this;

    // setup request body
    let body = {
        invoice_data: self.generateRequestBody(),
        opr_data: {
            account_alias: String(customer)
        }
    };

    return new Promise(function (resolve, reject) {
        request.post(self.baseURL + '/create')
            .set(self.config)
            .send(body)
            .end(function (err, res) {
                if (err) return reject(err)

                if (res.body.response_code === '00') {
                    self.token = res.body.invoice_token;
                    self.oprToken = res.body.token;
                    self.responseText = res.body.description;
                    resolve();
                } else {
                    let e = new Error('Failed to create invoice')
                    e.data = res.body
                    reject(e)
                }
            })
    })
};

/**
 * Charge an INTRAM account
 * @param  {string} oprToken     OPR token generated on first step of onsite payment
 * @param  {string} confirmToken Confirmation token sent to the INTRAM user
 * @return {promise}
 */
OnsiteInvoice.prototype.charge = function (oprToken, confirmToken){
    let self = this;
    let body = {
        token: oprToken + '',
        confirm_token: confirmToken + ''
    };

    return new Promise (function (resolve, reject) {
        request.post(self.baseURL + '/charge')
            .set(self.config)
            .send(body)
            .end(function (err, res) {
                if (err) return reject(err)
                if (res.body.response_code === '00') {
                    self.responseText = res.body.response_text;
                    self.status = res.body.invoice_data.status;
                    self.receiptURL = res.body.invoice_data.receipt_url;
                    self.customer = res.body.invoice_data.customer;
                    resolve();
                } else {
                    let e = new Error('Failed to charge invoice. Check OPR/confirm token and try again.')
                    e.data = res.body
                    reject(e)
                }
            })
    })
};

module.exports = OnsiteInvoice;