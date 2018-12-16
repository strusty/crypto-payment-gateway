var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var ApiurlsSchema = new Schema({
  symbol: String,
  type: {
    type: String,
    default: ''
  },
  url: String,
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
var Apiurls = mongoose.model('Apiurls', ApiurlsSchema);

module.exports = Apiurls;