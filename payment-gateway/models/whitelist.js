// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var WhitelistSchema = new Schema({
  symbol: String,    //token symbol
  address: String,
  account: String,
  buyer_email: String,
  status: {
    type: Number,
    default: 0
  },
  updatedAt: Date
});

WhitelistSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// the schema is useless so far
// we need to create a model using it
var Whitelist = mongoose.model('Whitelist', WhitelistSchema);

// make this available to our users in our Node applications
module.exports = Whitelist;