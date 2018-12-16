// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var ChecknumbersSchema = new Schema({
  symbol: String,           //coin symbol
  blocknumber: Number,      //last checked number
  createdAt: {
      type: Date,
      default: Date.now
  }
});

// the schema is useless so far
// we need to create a model using it
var Checknumbers = mongoose.model('Checknumbers', ChecknumbersSchema);

module.exports = Checknumbers;