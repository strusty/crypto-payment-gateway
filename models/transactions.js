// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var TransactionSchema = new Schema({
  amount: Number, // The amount of the transaction in the original currency (currency1 below).
  amount2: Number,
  currency1: String, // The original currency of the transaction.
  /*
   * The currency the buyer will be sending. 
   * For example if your products are priced in USD but you are receiving BTC, 
   * you would use currency1=USD and currency2=BTC.
   * currency1 and currency2 can be set to the same thing if you don't need currency conversion.
   */
  currency2: String, 
  /* 
   * Optionally set the address to send the funds to (if not set will use the settings you have set on the 'Coins Acceptance Settings' page).
   * Remember: this must be an address in currency2's network.
  */
  address: String,
  /*
   * Optionally (but highly recommended) set the buyer's email address. 
   * This will let us send them a notice if they underpay or need a refund. We will not add them to our mailing list or spam them or anything like that.
   */
  buyer_email: String, 
  buyer_name: String, // Optionally set the buyer's name for your reference.
  item_name: String, // Item name for your reference, will be on the payment information page and in the IPNs for the transaction.
  item_number: Number, //Item number for your reference, will be on the payment information page and in the IPNs for the transaction.
  invoice: String, // Another field for your use, will be on the payment information page and in the IPNs for the transaction.
  custom: String, // Another field for your use, will be on the payment information page and in the IPNs for the transaction.
  ipn_url: String, // URL for your IPN callbacks. If not set it will use the IPN URL in your Edit Settings page if you have one set.
  inv_id: String,
  depositAddress: String,
  depositAccount: String,
  txn_id: String,
  confirms_needed: Number,
  timeout: Number,
  status_text: String,
  status_url: String,
  qrcode_url: String,
  net: Number,
  status: {
    type: Number,
    default: -100
  },
  completed: {
    type: Number, // 0 - pending, -1 - expired, 1 - completed
    default: 0
  },
  txid: {
    type: String
  },
  send_tx: Number,
  wanted_coin_amount: Number,
  need_more_amount: Number,
  fee_amount: Number,
  fee_tx: String,
  commission_status: {
    type: Number,
    default: 0,
  },
  company_status: {
    type: Number,
    default: 0,
  },
  company_tx: String, 
  return_tx: String, 
  transaction_type: {
    type: String,
    default: "sale"
  },
  merchant: String,
  allow_ipn: {
    type: Boolean,
    default: true
  },

  createdAt: {
      type: Date,
      default: Date.now
  }
});

// the schema is useless so far
// we need to create a model using it
var Transactions = mongoose.model('Transactions', TransactionSchema);

module.exports = Transactions;