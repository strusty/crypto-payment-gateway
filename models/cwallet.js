// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var CWalletSchema = new Schema({
  userid: String,
  symbol: String,    //token symbol
  address: String,
  accountType: {
    type: String,
    default: "person"
  },
  balance: {
    type: Number,
    default: 0,
  },
  updatedAt: Date
});

CWalletSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// the schema is useless so far
// we need to create a model using it
var CWallet = mongoose.model('CWallet', CWalletSchema);

// make this available to our users in our Node applications
module.exports = CWallet;