const configs = require('../config/configs').get(process.env.NODE_ENV);

const rp = require('request-promise');

const WhitelistModel = require('../models/whitelist');

exports.createAccount = async function (account) {
  console.log('account: ', account);
  let apiUrl = configs.node_api_url.BCH + "/api/v1/bch/createaccount";

  let options = {
    method: 'POST',
    uri: apiUrl,
    body: {account},
    json: true
  }

  try {
    let res = await rp(options);
    let address = '';

    address = res.result;

    return address;
  } catch (e) {
    console.log('createAccount ERROR : ', e);

    return null;
  }
}

exports.createAddress = async function (account) {
  console.log('account: ', account);
  let apiUrl = configs.node_api_url.BCH + "/api/v1/bch/createaddress";

  let options = {
    method: 'POST',
    uri: apiUrl,
    body: {account},
    json: true
  }

  try {
    let res = await rp(options);
    let address = '';

    address = res.result;

    return address;
  } catch (e) {
    console.log('createAddress ERROR : ', e);

    return null;
  }
}

exports.getBalance = async function (account, symbol) {
  console.log('account: ', account);
  if (account == '') {
    return {status: 'fail', address: '', balance: 0};
  }

  let apiBalanceUrl = configs.node_api_url.BCH + "/api/v1/bch/getaccountbalance/" + account;

  let balancePptions = {
    method: 'GET',
    uri: apiBalanceUrl,
    headers: {

    },
    json: true
  }

  let balance = null;
  try {
    balance = await rp(balancePptions);
    console.log('balance - line 57 : ', balance);
  } catch (e) {
    console.log('getBalance ERROR line-72 : ', e);

    balance = {result: 0};
  }

  let apiAddressUrl = configs.node_api_url.BCH + "/api/v1/bch/getaccountaddress/" + account;

  let accountOptions = {
    method: 'GET',
    uri: apiAddressUrl,
    headers: {

    },
    json: true
  }

  let address = '';
  try {
    address = await rp(accountOptions);

    return {status: 'ok', address: address.result, balance: balance.result};
  } catch (e) {
    console.log('getBalance ERROR line-93 : ', e);

    return {status: 'fail', address: address, balance: balance.result};
  }
}

exports.getBalanceByAddress = async function (address, symbol) {
  console.log('account: ', address);
  if (address == '') {
    return {status: 'fail', address: '', balance: 0};
  }

  let account = await WhitelistModel.findOne({address: address, status: 0});

  if (!account) {
    return {status: 'fail', address: '', balance: 0};
  }

  let apiBalanceUrl = configs.node_api_url.BCH + "/api/v1/bch/getaccountbalance/" + account.account;

  let balancePptions = {
    method: 'GET',
    uri: apiBalanceUrl,
    headers: {

    },
    json: true
  }

  let balance = null;

  try {
    address = await rp(accountOptions);

    return {status: 'ok', balance: balance.result};
  } catch (e) {
    console.log('getBalance ERROR line-93 : ', e);

    return {status: 'fail', balance: balance.result};
  }
}

exports.listAaccounts = async function () {
  let apiUrl = configs.node_api_url.BCH + "/api/v1/bch/listaccounts";

  let options = {
    method: 'GET',
    uri: apiUrl,
    headers: {

    },
    json: true
  }

  try {
    let res = await rp(options);
    console.log(res);

    return res;
  } catch (e) {
    console.log('listAaccounts ERROR : ', e);
    return null;
  }
}

exports.getTransaction = async function (txhash) {
  let apiUrl = configs.node_api_url.BCH + "/api/v1/bch/gettransaction/" + txhash;

  let options = {
    method: 'GET',
    uri: apiUrl,
    headers: {

    },
    json: true
  }

  try {
    let res = await rp(options);
    console.log(res);

    return res;
  } catch (e) {
    console.log('getTransaction ERROR : ', e);

    return null;
  }
}

exports.listTransactions = async function (coin, account, count = 1000000000, from = 0) {
  let apiUrl = configs.node_api_url.BCH + "/api/v1/bch/listtransactions";

  if (account == '') {
    return null;
  }

  let options = {
    method: 'POST',
    uri: apiUrl,
    body: {account, count, from},
    json: true
  }

  try {
    let res = await rp(options);

    return res;
  } catch (e) {
    console.log ('listTransactions ERROR : ', e);

    return null;
  }
}

exports.listTransactionsByAddress = async function (coin, address, page=0, offset=1000) {
  let apiUrl = configs.node_api_url.BCH + "/api/v1/bch/listtransactions";

  if (address == '') {
    return null;
  }

  let acc = await WhitelistModel.findOne({address: address, status: 0});

  if (!acc) {
    return null;
  }

  let account = acc.account;
  let from = page * offset;
  let count = offset;

  let options = {
    method: 'POST',
    uri: apiUrl,
    body: {account, count, from},
    json: true
  }

  try {
    let res = await rp(options);

    return res;
  } catch (e) {
    console.log ('listTransactions ERROR : ', e);

    return null;
  }
}

exports.getReceivedByAddress = async function (address, confirm=2) {
  let apiUrl = configs.node_api_url.BCH + "/api/v1/bch/getreceivedbyaddress";

  let options = {
    method: 'POST',
    uri: apiUrl,
    body: {address, confirm},
    json: true
  }

  try {
    let res = await rp(options);
    console.log(res);

    return res.result;
  } catch (e) {
    console.log('getReceivedByAddress ERROR : ', address, e);

    return null;
  }
}

exports.sendFromAccount = async function (fromaccount, toaddress, amount, confirm = 2, symbol='BCH') {
  let apiUrl = configs.node_api_url.BCH + "/api/v1/bch/sendfrom";

  let options = {
    method: 'POST',
    uri: apiUrl,
    body: {
      fromaccount: fromaccount,
      toaddress: toaddress,
      amount: Number(parseFloat(amount).toFixed(8)),
      confirm: confirm
    },
    json: true
  }

  try {
    let res = await rp(options);
    console.log('options', options);
    console.log('sendfromaccount : ', res);
    
    return {status: "ok", data: {txhash: res.result}};
  } catch(e) {
    console.log('bitcoin - line 163:', e);
    return {status: "fail", error: e};
  }
}

exports.sendManyFromAccount = async function (fromaccount, toaddresses, confirm = 2, symbol='BCH') {
  let apiUrl = configs.node_api_url.BCH + "/api/v1/bch/sendmany";

  // let to = toaddresses.reduce((result, item) => {
  //   let key = Object.keys(item)[0];
  //   result[key] = item[key];
  //   return result;
  // }, {});

  let options = {
    method: 'POST',
    uri: apiUrl,
    body: {
      fromaccount: fromaccount,
      toaddresses: toaddresses,
      confirm: confirm
    },
    json: true
  }

  try {
    let res = await rp(options);
    console.log('options', options);
    console.log('sendmanyfromaccount : ', res);
    
    return {status: "ok", data: {txhash: res.result}};
  } catch(e) {
    console.log('bitcoin - line 163:', e);
    return {status: "fail", error: e};
  }
}

exports.sendToAddress = async function (toaddress, amount, subfee = true) {
  let apiUrl = configs.node_api_url.BCH + "/api/v1/bch/sendtoaddress";

  let options = {
    method: 'POST',
    uri: apiUrl,
    body: {
      toaddress: toaddress,
      amount: Number(parseFloat(amount).toFixed(8)),
      subfee: subfee
    },
    json: true
  }

  try {
    let res = await rp(options);
    console.log('options', options);
    console.log('sendfromaccount : ', res);
    
    return {status: "ok", data: {txhash: res.result}};
  } catch(e) {
    console.log('bitcoin - line 163:', e);
    return {status: "fail", error: e};
  }
}

/********************************* FOR ICO ************************************/
exports.createAccountPK = async function (account) {
  console.log('account: ', account);
  let apiUrl = configs.node_api_url.BCH + "/api/v1/bch/createaccount";

  let options = {
    method: 'POST',
    uri: apiUrl,
    body: {account},
    json: true
  }

  try {
    let res = await rp(options);
    let address = '';

    address = res.result;

    return address;
  } catch (e) {
    console.log('createAccount ERROR : ', e);

    return null;
  }
}

exports.sendFromAccountPK = async function (fromaccount, toaddress, amount, confirm = 2, symbol='BCH') {
  let apiUrl = configs.node_api_url.BCH + "/api/v1/bch/sendfrom";

  let options = {
    method: 'POST',
    uri: apiUrl,
    body: {
      fromaccount: fromaccount,
      toaddress: toaddress,
      amount: Number(parseFloat(amount).toFixed(8)),
      confirm: confirm
    },
    json: true
  }

  try {
    let res = await rp(options);
    console.log('options', options);
    console.log('sendfromaccount : ', res);
    
    return {status: "ok", data: {txhash: res.result}};
  } catch(e) {
    console.log('bch - line 163:', e);
    return {status: "fail", error: e};
  }
}

exports.getReceivedByAddressPK = async function (address, confirm=2) {
  let apiUrl = configs.node_api_url.BCH + "/api/v1/bch/getreceivedbyaddress";

  let options = {
    method: 'POST',
    uri: apiUrl,
    body: {address, confirm},
    json: true
  }

  try {
    let res = await rp(options);
    console.log(res);

    return res.result;
  } catch (e) {
    console.log('getReceivedByAddress ERROR : ', address, e);

    return null;
  }
}