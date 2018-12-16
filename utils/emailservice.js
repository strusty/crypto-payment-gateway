const SparkPost = require('sparkpost');

require('dotenv').config();
let configs = require('../config/configs').get(process.env.NODE_ENV);

const sparky = new SparkPost(configs.SPARKPOST_KEY);


let send = function (from, recipients, title, body) {
  sparky.transmissions.send({
    options: {
      sandbox: false
    },
    content: {
      from: from,
      subject: title,
      html: body
    },
    recipients: recipients
  })
  .then(data => {
    console.log('send Email : ', data);
  })
  .catch(err => {
    console.log('failed to send email: ', err);
  });
}

exports.sendEmail = function (from, recipients, title, body) {
  send(from, recipients, title, body);
}

exports.sendEmailNotification = function (recipients, title, body) {
  sparky.transmissions.send({
    options: {
      sandbox: false
    },
    content: {
      from: 'no-reply@chaintxn.net',
      subject: title,
      html: body
    },
    recipients: recipients
  })
  .then(data => {
    console.log('send Email notification : ', data);
  })
  .catch(err => {
    console.log('failed to send email notification: ', err);
  });
}

exports.newPaymentSubittedNotification = function (recipient, name, amount, coin, txn_id) {
  let title = '[chainpayments.io] New Payment Submitted';
  let body = '<html><body>'
  body += '<p>Hello ' + name + '</p>';
  body += '<p>A new payment of ' + amount + ' ' + coin + ' has been submitted and your buyer should send payment shortly</p>'
  body += '<p>NOTE: At the time of mailing we have not received any funds from your buyer, you SHOULD NOT ship any items or provide any services at this time!<br /><br />';
  body += 'We`ll send you another update once funds have been received.<br /><br />';
  body += 'You can view the details of this payment in your account at <a href="#" target="_blink">dashboard</a> <br /><br />';
  body += 'For your reference the payment ID is ' + txn_id + '<br /><br />';
  body += 'Thank you, <br />';
  body += '<strong>chainpayments.io</strong><br /><br />';
  body += 'Support is available at: https://www.chaintxn.net/support </p>';
  body += '</body></html>';

  let from = 'no-reply@chaintxn.net';

  send(from, recipient, title, body);
}

exports.buyerFundsReceivedNotification = function (recipient, name, amount, coin, txn_id) {
  let title = '[chainpayments.io] Buyer Funds Received';
  let body = '<html><body>'
  body += '<p>Hello ' + name + '</p>';
  body += '<p>We have received the funds for payment ' + txn_id + ' of ' + amount + ' ' + coin + ', they will be sent to you shortly.</p>';
  body += '<p>You can view the details of this payment in your account in <a href="#">dashboard</a>';
  body += '<p>Thank you for using <a href="#">billionexpro.com</a>! </p>';
  body += '<p>Support is available at: <a href="#">https://www.chaintxn.net/support</a></p>';
  body += '</body></html>';

  let from = 'no-reply@chaintxn.net';

  send(from, recipient, title, body);
}

exports.paymentCompleteNotification = function (recipient, name, amount, coin, txn_id) {
  let title = '[chainpayments.io] Payment Complete';
  let body = '<html><body>'
  body += '<p>Hello ' + name + '</p>';
  body += '<p>Payment of ' + amount + ' ' + coin + ' for transaction ' + txn_id + ' has been sent to you and should arrive shortly. The payment is now Complete. </p>';
  body += '<p>You can view the details of this payment in your account in <a href="#">dashboard</a>';
  body += '<p>Thank you for using <a href="#">chaintxn.net</a>! </p>';
  body += '<p>Support is available at: <a href="#">https://www.chaintxn.net/support</a></p>';
  body += '</body></html>';

  let from = 'no-reply@chaintxn.net';

  send(from, recipient, title, body);
}

exports.coinDepositReceivedNotification = function (recipient, name, amount, coin, address, txid) {
  let title = '[chainpayments.io] Coin Deposit Received';
  let body = '<html><body>'
  body += '<p>Hello ' + name + '</p>';
  body += '<p>A deposit of ' + amount + ' ' + coin + ' has been received and confirmed into your BillionexPro Wallet. The deposit was received on ' + address + ' with transaction ID ' + txid + '.</p>';
  body += '<p>Thank you for using <a href="#">chaintxn.net</a>! </p>';
  body += '<p>Support is available at: <a href="#">https://www.chaintxn.net/support</a></p>';
  body += '</body></html>';

  let from = 'no-reply@chaintxn.net';

  send(from, recipient, title, body);
}

exports.coinPaymentTimeoutNotification = function (recipient, name, amount, coin, txn_id) {
  let title = '[chainpayments.io] Payment Timed Out';
  let body = '<html><body>'
  body += '<p>Hello ' + name + '</p>';
  body += '<p>Payment of ' + amount + ' ' + coin +  ' to billionexpro has timed out without us receiving the required funds. Then transaction with ID ' + txn_id + ' has been cacelled.</p>';
  body += '<p>Thank you for using <a href="#">chaintxn.net</a>! </p>';
  body += '<p>Support is available at: <a href="#">https://www.chaintxn.net/support</a></p>';
  body += '</body></html>';

  let from = 'no-reply@chaintxn.net';

  send(from, recipient, title, body);
}

exports.commissionNotification = function (recipient, name, amount, coin, txn_id, fee_tx) {
  let title = '[chainpayments.io] Commission Payment';
  let body = '<html><body>'
  body += '<p>Hello ' + name + '</p>';
  body += '<p>Transferred ' + amount + ' ' + coin + ' from Payment of ' + txn_id + ' for commission. You can check with this transaction hash ' + fee_tx + ' </p>';
  body += '<p>Thank you for using <a href="#">chaintxn.net</a>! </p>';
  body += '<p>Support is available at: <a href="#">https://www.chaintxn.net/support</a></p>';
  body += '</body></html>';

  let from = 'no-reply@chaintxn.net';

  send(from, recipient, title, body);
}

exports.companySendNotification = function (recipient, name, amount, coin, txn_id, company_tx) {
  let title = '[chainpayments.io] Sent to company';
  let body = '<html><body>'
  body += '<p>Hello ' + name + '</p>';
  body += '<p>Transferred ' + amount + ' ' + coin + ' from Payment of ' + txn_id + ' for company. You can check with this transaction hash ' + company_tx + ' </p>';
  body += '<p>Thank you for using <a href="#">chaintxn.net</a>! </p>';
  body += '<p>Support is available at: <a href="#">https://www.chaintxn.net/support</a></p>';
  body += '</body></html>';

  let from = 'no-reply@chaintxn.net';

  send(from, recipient, title, body);
}