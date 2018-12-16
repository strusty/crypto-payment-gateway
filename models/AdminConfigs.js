var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var AdminConfigsSchema = new Schema({
  merchant: String,
  ipn_url: String,
  addresses: {
    type: Object,
    default: {}
  },
  depositAccount: String,
  masterAddress: {
    type: Object,
    default: {}
  },
  status: {
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
var AdminConfigs = mongoose.model('AdminConfigs', AdminConfigsSchema);

module.exports = AdminConfigs;