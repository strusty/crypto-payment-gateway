const configs = require('../config/configs').get(process.env.NODE_ENV);

const rp = require('request-promise');

exports.createAccount = async function (account) {
  console.log('account: ', account);
  let apiUrl = configs.node_api_url.ZEC + "/api/v1/zcash/createaccount";

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
  let apiUrl = configs.node_api_url.ZEC + "/api/v1/zcash/createaddress";

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
  let apiBalanceUrl = configs.node_api_url.ZEC + "/api/v1/zcash/getaccountbalance/" + account;

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

  let apiAddressUrl = configs.node_api_url.ZEC + "/api/v1/zcash/getaccountaddress/" + account;

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

exports.listAaccounts = async function () {
  let apiUrl = configs.node_api_url.ZEC + "/api/v1/zcash/listaccounts";

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
  let apiUrl = configs.node_api_url.ZEC + "/api/v1/zcash/gettransaction/" + txhash;

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

exports.listTransactions = async function (account, count = 1000000000, from = 0) {
  let apiUrl = configs.node_api_url.ZEC + "/api/v1/zcash/listtransactions";

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
  let apiUrl = configs.node_api_url.ZEC + "/api/v1/zcash/getreceivedbyaddress";

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
    console.log('getReceivedByAddress ERROR : ', e);

    return null;
  }
}

exports.sendFromAccount = async function (fromaccount, toaddress, amount, confirm = 2, symbol='ZEC') {
  let apiUrl = configs.node_api_url.ZEC + "/api/v1/zcash/sendfrom";

  let options = {
    method: 'POST',
    uri: apiUrl,
    body: {
      fromaccount: fromaccount,
      toaddress: toaddress,
      amount: amount,
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
    console.log('zcash - line 163:', e);
    return {status: "fail", error: e};
  }
}

exports.sendManyFromAccount = async function (fromaccount, toaddresses, confirm = 2, symbol='ZEC') {
  let apiUrl = configs.node_api_url.ZEC + "/api/v1/zcash/sendmany";

  let to = toaddresses.reduce((result, item) => {
    let key = Object.keys(item)[0];
    result[key] = item[key];
    return result;
  }, {});

  let options = {
    method: 'POST',
    uri: apiUrl,
    body: {
      fromaccount: fromaccount,
      to: to,
      amount: amount,
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
    console.log('litecoin - line 163:', e);
    return {status: "fail", error: e};
  }
}