// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// create a schema
var apiKeysSchema = new Schema({
  userid: String,     //user who ordered api
  appname: String,    //app name
  created: Number,    //key ordered timestamp
  seed: String,       //seed string for creating secret key
  permission: {       //permission of using api
    read: Number,
    write: Number 
  },
  key: String,        //api key
  secret: String,      //secret
  issuer: String,
  merchant: String
});

// the schema is useless so far
// we need to create a model using it
var ApiKeys = mongoose.model('ApiKeys', apiKeysSchema);

// make this available to our users in our Node applications
module.exports = ApiKeys;