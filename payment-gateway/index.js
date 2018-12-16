// Setup basic express server
const fs = require('fs');
const join = require('path').join;
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const server = require('http').createServer(app);
const cors = require('cors');
const io = require('socket.io')(server);

require('dotenv').config();

const port = process.env.PORT || 8080;
const config = require('./config/configs').get(process.env.NODE_ENV);

// listen the server port
server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// connect mongodb
connect();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.use(cors());

// cors
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

require('./route/route')(app);
require('./service/updateprocess').startUpdateService(io, config.MERCHANT);

function connect () {
  return mongoose.connect(config.db, {useNewUrlParser: true}).connection;
}