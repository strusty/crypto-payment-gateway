var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var SmartcontractsSchema = new Schema({
  symbol: String,
  fullname: String,
  parent: {
    type: String,
    default: 'ETH'
  },
  type: {
    type: String,
    default: 'ERC20'
  },
  abi: String,
  decision: Number,
  address: String,

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// the schema is useless so far
// we need to create a model using it
var Smartcontracts = mongoose.model('Smartcontracts', SmartcontractsSchema);

module.exports = Smartcontracts;