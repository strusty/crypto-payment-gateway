const configs = require('../config/configs').get(process.env.NODE_ENV);

const rp = require('request-promise');
const etherscan = require('etherscan-api').init(configs.ETHERSCAN_API_KEY, configs.ETH_NETWORK);

exports.createAccount = async function (account) {
  console.log('createAccount: ', account);
  let apiUrl = configs.node_api_url.BIXC + "/api/v1/bixc/createaccount";

  let options = {
    method: 'POST',
    uri: apiUrl,
    body: {},
    json: true
  }

  let res = await rp(options);
  console.log(res);

  return res.address;
}

exports.createAddress = async function (account) {
  console.log('createAccount: ', account);
  let apiUrl = configs.node_api_url.BIXC + "/api/v1/bixc/createaccount";

  let options = {
    method: 'POST',
    uri: apiUrl,
    body: {},
    json: true
  }

  let res = await rp(options);
  console.log(res);

  return res.address;
}

exports.getBalance = async function (account, symbol) {
  console.log('account: ', account);
  let apiBalanceUrl = configs.node_api_url.BIXC + "/api/v1/bixc/getbalance/" + account;

  let balanceOptions = {
    method: 'GET',
    uri: apiBalanceUrl,
    headers: {

    },
    json: true
  }

  try {
    let ret = await rp(balanceOptions);
    // console.log(ret);

    return {status: 'ok', address: account, balance: ret.balance};
  } catch (e) {
    console.log('get BIXC balance ERROR : ', e);
    return {status: 'fail', address: account, balance: 0};
  }
}

exports.listTransactions = async function (address) {
  try {
    let txlist = await etherscan.account.txlist(address);
    return txlist;
  } catch(e) {
    console.log('get transaction list by address error: ', e);
    return null;
  }
}

exports.sendFromAccount = async function(from, to, value, extra, symbol='BIXC') {
  let apiUrl = configs.node_api_url.BIXC + "/api/v1/bixc/transfer";

  let options = {
    method: 'POST',
    uri: apiUrl,
    body: {
      from: from,
      to: to,
      value: value
    },
    json: true
  }

  console.log("options ", options);
  let res = await rp(options);

  return res;
}

exports.sendManyFromAccount = async function(from, toaddresses, extra, symbol='BIXC') {
  let apiUrl = configs.node_api_url.BIXC + "/api/v1/bixc/transfer";

  let options = {};
  let txhashes = [];

  for (let i = 0; i < toaddresses.length; i++) {
    options = {
      method: 'POST',
      uri: apiUrl,
      body: {
        from: from,
        to: Object.keys(toaddresses[i])[0],
        value: Object.keys(toaddresses[i])[1]
      },
      json: true
    }

    console.log("options ", options);
    let res = await rp(options);
    txhashes.push(res);
    sleep.msleep(2500);
  }

  return {status: "ok", data: {txhash: txhashes}};
}