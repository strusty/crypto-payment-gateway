const path = require('path');
const express = require('express');
const fs = require('fs');

const mongo_express = require('mongo-express/lib/middleware');
const mongoAdmin = require('../utils/mongoexpress.js');

const DispatchController = require('../controllers/dispatch');
const ApiController = require('../controllers/apisecret');
const AdminController = require('../controllers/admin');

const authUtils = require('../utils/authUtils');

let JWT_Verify = async function (req, res, next) {
  let result = await authUtils.jwtVerify(req.headers.authorization, req.headers.signature, req.body);

  if (!result.success) {
    console.log('Invalid Auth!');
    return res.status(403).json(result);
  }

  console.log('----------auth code---------------', result);
  // req.body.userid = result.userid;
  next();
};

module.exports = function (app) {
  app.use('/mongoadmin', mongo_express(mongoAdmin));
  app.get('/qrgen/:txn_id/:address', DispatchController.grGenerate);
  app.get('/qrcode/:address', DispatchController.getqrcode);

  app.get('/status/:txn_id/:address', DispatchController.getStatus);

  app.post('/api/v1/create_account', DispatchController.createUserAccount);
  app.post('/api/v1/getbalance', DispatchController.getBalance);
  app.post('/api/v1/getbalancebyaddress', DispatchController.getBalanceByAddress);
  app.post('/api/v1/getbalancelist', DispatchController.getBalanceListByEmail);
  app.post('/api/v1/transactionlist', DispatchController.getTransactionList);
  app.post('/api/v1/transactionlistbyaddress', DispatchController.getTransactionListByAddress);
  app.post('/api/v1/transfer', DispatchController.transfer);
  app.post('/api/v1/create_exchange', DispatchController.createExchange);
  app.post('/api/v1/getcoinprices', DispatchController.getCoinPrices);

  app.post('/api/v1/register-api', ApiController.registerAPI);
  app.post('/api/v1/request-token', ApiController.requestToken);
  app.post('/api/v1/getapikey', ApiController.getApiKeyAPI);
  app.post('/api/v1/getapisecret/:userid', ApiController.getSecretAPI);

  // Admin config
  app.post('/admin/config/addapiurl', AdminController.addApiUrl);
  app.post('/admin/config/addabi', AdminController.addAbi);
  app.post('/admin/config/enableabi', AdminController.enableAbi);
  app.post('/admin/config/addipnurl', AdminController.addIpnUrl);
  app.post('/admin/config/add_deposit_account', AdminController.addDepositAccount);

  app.post('/admin/manage/addmasteraddress', AdminController.addMasterAddress);
  app.post('/admin/manage/addinternaladdress', AdminController.addInternalAddress);
  app.post('/admin/manage/updatewbexprice', AdminController.updateWbexPrice);

}