# INTRAM NodeJS API Client


[![npm version](https://badge.fury.io/js/intram-node.svg)](https://npmjs.org/package/intram-node)  [![downloads](https://img.shields.io/npm/dw/intram-node.svg)](https://npmjs.org/package/intram-node)  [![open issues](https://img.shields.io/github/issues-raw/suntech/intram-node.svg)](https://github.com/suntech/intram-node/issues)  [![license](https://img.shields.io/github/license/suntech/intram-node.svg)](https://github.com/suntech/intram-node/blob/master/LICENSE)  [![debug](https://img.shields.io/badge/debug-blue.svg)](https://github.com/visionmedia/debug#readme)  [![build status](https://img.shields.io/travis/suntech/intram-node/master.svg)](https://travis-ci.org/suntech/intram-node#master)  [![coverage status](https://coveralls.io/repos/suntech/intram-node/badge.svg)](https://coveralls.io/github/suntech/intram-node)  [![dependency status](https://david-dm.org/suntech/intram-node.svg?theme=shields.io)](https://david-dm.org/suntech/intram-node)  [![devDependency status](https://david-dm.org/suntech/intram-node/dev-status.svg)](https://david-dm.org/suntech/intram-node#info=devDependencies)  [![Greenkeeper](https://badges.greenkeeper.io/suntech/intram-node.svg)](https://greenkeeper.io/)  [![semantic release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release#badge)  [![Gitter](https://badges.gitter.im/suntech/intram-node.svg)](https://gitter.im/suntech/intram-node)

The [Node.JS](http://nodejs.org) library for [INTRAM (intram.com)](https://intram.com).

Built on the INTRAM HTTP API (beta).

## Installation

```sh
npm install --save intram
```

## API configuration

Setup intram API keys.

```js
var setup = new intram.Setup({
  mode: 'test', // optional. use in sandbox mode.
  marchandKey: 'tpk_5e9469e65341de91988b352eba11f9f0c5f671384e1d6bfb09ce30103bcc09903b42dfacfb2b436d4b48af01f763bbaa1748b1d6ea165d4a2f581bcfd1fd8943',
  privateKey: 'tpk_5e9469e65341de91988b352eba11f9f0c5f671384e1d6bfb09ce30103bcc09903b42dfacfb2b436d4b48af01f763bbaa1748b1d6ea165d4a2f581bcfd1fd8943',
  publicKey: "5e59e0c34bb8737cedf4c0ec92d9ae94007e33e5c30280596456990d9fc2f6058147a092fa6017ab5a25150fc0dd2991cff0e49b9ee8cb04355b689769d68d44",
  secret: 'tsk_243a7b89fd82a2b4e049c0c8ff39c3012ee6ec70bda3288ad2bf6a1270439ce4245e2f1ea7e4c03beb5cd807cbc7a32c0baf7de3a1f9d9b8593bab38af6531f7'          
});
```

It might usually be suitable to put your API configuration in environment variables. In that case you can initialize `intram.Setup` without passing configuration parameters.
The library will automatically detect the environment variables and use them.
Auto-detected environment variables: `INTRAM_MARCHAND_KEY`, `INTRAM_PRIVATE_KEY`, `INTRAM_PUBLIC_KEY`,  `INTRAM_SECRET`


## Checkout Store Configuration

```js
var store = new intram.Store({
  name: 'LandryShop', // only name is required
  tagline: "Votre satisfaction, notre priorité.",
  phoneNumber: '229670000000',
  postalAddress: 'Benin-Cotonou Akpakpa',
  websiteURL: 'Benin - Cotonou - Akpakpa',
  logoURL: 'http://www.landryShop/logo.png',
  color:"blue", //for custom paiement portal color,
  template:"default", // Choose the payment portal model that your customers will see
});
```

## Initialize Checkout Invoice

```js
var invoice = new intram.CheckoutInvoice(setup, store);
```

## Initialize Onsite Invoice

```js
var invoice = new intram.OnsiteInvoice(setup, store);
```

## Add Invoice Items & Description

```js
invoice.addItem('Phone LG 300T', 3, 150000, 450000); // name, quantity, unit price, total price
invoice.description = 'Pretty and suitable for your waterfall'
```

## Setting Total Amount Chargeable

```js
invoice.totalAmount = 450000;
```

## Redirecting to intram Checkout
After setting total amount and adding items to your invoice you can create a checkout and redirect the customer. It takes a callback which gets passed the updated invoice object containing the url.

```js
invoice.create()
  .then(function (){
    invoice.status;
    invoice.token; // invoice token
    invoice.url; // INTRAM redirect checkout url
  })
  .catch(function (e) {
    console.log(e);
  });
```

## Extra API methods

### Adding Tax Information
You may include tax information on on the checkout page. This information will be available on the invoice & receipt printouts and PDF downloads.

```js
invoice.addTax('VAT (18%)', 3000);
invoice.addTax('others taxes (5%)', 200);
```

### Adding Custom Data
There are times when you may need to add an extra load of data with the checkout information for later use. intram allows saving of custom data on their servers which are persisted even after successful payment.
Note: Custom data is not displayed anywhere on the checkout page, invoice/receipt download & printouts.

```js
invoice.addCustomData('CartID', 32393);
invoice.addCustomData('PERIOD', 'TABASKI');
```

### Setting a Cancel URL
You can optionally set the URL where your customers will be redirected to after canceling a checkout.
Note: There are two options as to how the cancel URL is set, one is to set it globally using the checkout setup information and the other is set it as per checkout invoice.
Setting the cancel URL directly on the invoice instance will overwrite the global settings if already set.

```js
// Globally
var store = new intram.Store({
  name: 'LandryShop',
  cancelURL: 'http://www.landryshop.com/',
});

// Per Checkout
invoice.cancelURL = 'http://www.landryshop.com/';
```

### Setting a Callback URL
INTRAM does a good job of managing receipt downloads and printouts after your customer successfuly makes payment. However there may be cases where you may descide to redirect your customers to another URL after successfully making payment. Return URL guarantees this action.
Note: INTRAM will append `?STATUS=INVOICE_STATUS?transaction_id=INVOICE_TOKEN` to your URL.

```js
// Globally
var store = new intram.Store({
  name: 'LandryShop',
  callbackURL: 'http://www.landryshop.com/confirm'
});

// Per Checkout
invoice.callBackURL = 'http://www.landryshop/confirm';
```

### Confirming a Checkout Programatically
The API allows you to check on the status of any checkout using the checkout token key. You have access to all the data including the receipt download link & customer information in cases where the checkout has been confirmed as completed.

```js
var token = 'odaff0a023';

var invoice = new intram.CheckoutInvoice(setup, store);

invoice.confirm(token)
  .then(function (){
    invoice.status; //  SUCCESS, PENDING, CANCELED or FAIL
    // available if status == 'SUCCESS'
    invoice.customer; // {name: 'Bahsoumany Oualid', phone: '22967723243', email: 'obahsoumane@gmail.com'}
    invoice.receiptURL; // 'https://app.intram.com/sandbox-checkout/receipt/pdf/test_44a6fef19a.pdf'
  })
  .catch(function (e) {
    console.log(e);
  });
```
## Dependencies

- [bluebird](https://github.com/petkaantonov/bluebird): Full featured Promises/A+ implementation with exceptionally good performance
- [superagent](https://github.com/visionmedia/superagent): Small progressive client-side HTTP request library, and Node.js module with the same API, supporting many high-level HTTP client features

## Dev Dependencies

- [mocha](https://github.com/mochajs/mocha): Mocha is a feature-rich JavaScript test framework running on Node.js and in the browser, making asynchronous testing simple and fun. Mocha tests run serially, allowing for flexible and accurate reporting, while mapping uncaught exceptions to the correct test cases.


# Running Tests
To run tests just setup the API configuration environment variables. An internet connection is required for some of the tests to pass.

```sh
npm install -g mocha
```
Then
`npm test` or `mocha`

## License
MIT