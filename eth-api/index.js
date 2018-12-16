// Setup basic express server
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var bodyParser = require('body-parser');
var cors = require('cors');
var mongoose = require('mongoose');

var config = require('./config/common').info;

require('dotenv').config();

// var io = require('socket.io')(server);
var port = process.env.PORT || 8080;

// listen the server port
server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cors());

// connect mongodb
connect();

require('./route/route')(app);

function connect () {
  return mongoose.connect(config.db, {useNewUrlParser: true}).connection;
}