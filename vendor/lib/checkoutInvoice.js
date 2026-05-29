let Invoice = require('./invoice')
    , request = require('superagent')
;


// Inherit invoice
CheckoutInvoice.prototype = Object.create(Invoice.prototype);
CheckoutInvoice.prototype.constructor = CheckoutInvoice;

/**
 * CheckoutInvoice class
 * @param {object} setup Instance of intram.Setup
 * @param {object} store Instance of intram.Store
 */
function CheckoutInvoice(setup, store) {
    Invoice.call(this, setup, store);
}


/**
 * Create invoice
 * @return {promise}
 */
CheckoutInvoice.prototype.create = function (){
    let self = this;
    let requestBody = self.generateRequestBody();
    return new Promise(function (resolve, reject) {
        request.post(self.baseURL + 'payments/request')
            .set(self.config)
            .send(requestBody)
            .end(function (err, res) {
                if (err) return reject(err)
                if (!res.body.error) {
                    self.token = res.body.transaction_id;
                    self.url = res.body.receipt_url;
                    self.status=res.body.status;
                    //check invoice status
                    resolve(self.confirm());
                } else {
                    let e = new Error('Failed to create invoice.')
                    e.data = res.body
                    reject(e)
                }
            })
    });
};

/**
 * Get token status.
 * @param  {string} givenToken Invoice token
 * @return {promise}
 */
CheckoutInvoice.prototype.confirm = function (givenToken) {
    let self = this;
    let token = givenToken ? givenToken : self.token;
    return new Promise(function (resolve, reject) {
        request.get(self.baseURL + 'transactions/confirm/' + token)
            .set(self.config)
            .end(function (err, res) {
                  if (err) return reject(err)
                let body = res.body
                if (!body.error) {
                    self.status = body.status;
                    self.responseText = body.message!==undefined && body.message!==null ? body.message : "";
                    if (self.status === 'SUCCESS') {
                        self.customer = body.customer!==undefined && body.customer!==null ? body.customer : "";
                        self.receiptURL = body.receipt_url
                        if (body.custom_data && Object.keys(body.custom_data).length > 0)
                            self.customData = body.custom_data;
                    }
                    self.totalAmount = body.total_amount;
                    resolve();
                } else {
                    let e = new Error('Could not confirm invoice status.')
                    e.data = body
                    reject(e)
                }
            })
    });
}

module.exports = CheckoutInvoice;
