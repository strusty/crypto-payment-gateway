var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var CoinpriceSchema = new Schema({
  BTC: Number,
  ETH: Number,
  LTC: Number,
  ZEC: Number,
  BIXC: Number,
  WBTx: Number,
  WBT: Number,
  UBQ: Number,
  updateFlag: {
  	type: Number,
  	default: 0
  },

  createdAt: {
      type: Date,
      default: Date.now
  }
});

// the schema is useless so far
// we need to create a model using it
var Coinprices = mongoose.model('Coinprices', CoinpriceSchema);

module.exports = Coinprices;