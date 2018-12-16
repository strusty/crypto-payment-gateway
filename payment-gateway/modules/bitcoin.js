const configs = require('../config/configs').get(process.env.NODE_ENV);

const rp = require('request-promise');

const WhitelistModel = require('../models/whitelist');

exports.createAccount = async function (account) {
  console.log('account: ', account);
  let apiUrl = configs.node_api_url.BTC + "/api/v1/bitcoin/createaccount";

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
  let apiUrl = configs.node_api_url.BTC + "/api/v1/bitcoin/createaddress";

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

  let apiBalanceUrl = configs.node_api_url.BTC + "/api/v1/bitcoin/getaccountbalance/" + account;

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

  let apiAddressUrl = configs.node_api_url.BTC + "/api/v1/bitcoin/getaccountaddress/" + account;

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

  let account = await WhitelistModel.findOne({address: address});

  if (!account) {
    return {status: 'fail', address: '', balance: 0};
  }

  let apiBalanceUrl = configs.node_api_url.BTC + "/api/v1/bitcoin/getaccountbalance/" + account.account;

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

    return {status: 'ok', balance: balance.result};
  } catch (e) {
    console.log('getBalance ERROR line-93 : ', e);

    return {status: 'fail', balance: 0};
  }
}

exports.listAaccounts = async function () {
  let apiUrl = configs.node_api_url.BTC + "/api/v1/bitcoin/listaccounts";

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
  let apiUrl = configs.node_api_url.BTC + "/api/v1/bitcoin/gettransaction/" + txhash;

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
  let apiUrl = configs.node_api_url.BTC + "/api/v1/bitcoin/listtransactions";

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
  let apiUrl = configs.node_api_url.BTC + "/api/v1/bitcoin/listtransactions";

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
  let apiUrl = configs.node_api_url.BTC + "/api/v1/bitcoin/getreceivedbyaddress";

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

exports.sendFromAccount = async function (fromaddress, toaddress, amount, confirm = 2, symbol='BTC', fee=true) {
  let apiUrl = configs.node_api_url.BTC + "/api/v1/bitcoin/sendfrom";

  try {
    let account = await WhitelistModel.findOne({address: fromaddress});

    if (!account) {
      return {status: "fail", msg: "This address don't allow for transactions"};
    }

    let options = {
      method: 'POST',
      uri: apiUrl,
      body: {
        fromaccount: account.account,
        toaddress: toaddress,
        amount: Number(parseFloat(amount).toFixed(8)),
        confirm: confirm,
        fee: fee
      },
      json: true
    }

    let res = await rp(options);
    console.log('options', options);
    console.log('sendfromaccount : ', res);
    
    return {status: "ok", data: {txhash: res.result}};
  } catch(e) {
    console.log('bitcoin - line 163:', e);
    return {status: "fail", error: e};
  }
}

exports.sendFromAccountWithoutCheck = async function (fromaddress, toaddress, amount, confirm = 2, symbol='BTC') {
  let apiUrl = configs.node_api_url.BTC + "/api/v1/bitcoin/sendfrom";

  try {
    let options = {
      method: 'POST',
      uri: apiUrl,
      body: {
        fromaccount: fromaddress,
        toaddress: toaddress,
        amount: Number(parseFloat(amount).toFixed(8)),
        confirm: confirm
      },
      json: true
    }

    let res = await rp(options);
    console.log('options', options);
    console.log('sendfromaccount : ', res);
    
    return {status: "ok", data: {txhash: res.result}};
  } catch(e) {
    console.log('bitcoin - line 163:', e);
    return {status: "fail", error: e};
  }
}

exports.sendManyFromAccount = async function (fromaccount, toaddresses, confirm = 2, symbol='BTC') {
  let apiUrl = configs.node_api_url.BTC + "/api/v1/bitcoin/sendmany";

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
  let apiUrl = configs.node_api_url.BTC + "/api/v1/bitcoin/sendtoaddress";

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
  let apiUrl = configs.node_api_url.BTC + "/api/v1/bitcoin/createaccount";

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

exports.sendFromAccountPK = async function (fromaddress, toaddress, amount, confirm = 2, symbol='BTC') {
  let apiUrl = configs.node_api_url.BTC + "/api/v1/bitcoin/sendfrom";

  try {
    let account = await WhitelistModel.findOne({address: fromaddress});

    if (!account) {
      return {status: "fail", msg: "This address don't allow for transactions"};
    }

    let options = {
      method: 'POST',
      uri: apiUrl,
      body: {
        fromaccount: account.account,
        toaddress: toaddress,
        amount: Number(parseFloat(amount).toFixed(8)),
        confirm: confirm
      },
      json: true
    }

    let res = await rp(options);
    console.log('options', options);
    console.log('sendfromaccount : ', res);
    
    return {status: "ok", data: {txhash: res.result}};
  } catch(e) {
    console.log('bitcoin - line 163:', e);
    return {status: "fail", error: e};
  }
}

exports.getReceivedByAddressPK = async function (address, confirm=2) {
  let apiUrl = "http://35.231.208.250/api/v1/bitcoin/getreceivedbyaddress";

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