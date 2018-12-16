const configs = require('../config/configs').get(process.env.NODE_ENV);

const request = require('request');
const rp = require('request-promise');
const sleep = require('sleep');

const WhitelistModel = require('../models/whitelist');

const delay = (msec=1000) => {
  return new Promise(resolve => {
    setTimeout(resolve, msec);
  });
};

// const etherscan = require('etherscan-api').init(configs.ETHERSCAN_API_KEY, configs.ETH_NETWORK);

exports.createAccount = async function (account) {
  console.log('createAccount: ', account);
  let apiUrl = configs.node_api_url.UBQ + "/api/v1/create_account_pk";

  let options = {
    method: 'POST',
    uri: apiUrl,
    body: {
      accountname: account
    },
    json: true
  }

  try {
    let res = await rp(options);
    console.log(res);

    return res.data.address;
  } catch (e) {
    console.log('UBQ createAccount ERROR : ', e);
    return null;
  }
}

exports.createAccountPK = async function (account) {
  console.log('createAccount: ', account);
  let apiUrl = configs.node_api_url.UBQ + "/api/v1/create_account_pk";

  let options = {
    method: 'POST',
    uri: apiUrl,
    body: {
      accountname: account
    },
    json: true
  }

  try {
    let res = await rp(options);
    console.log(res);

    return res.data.address;
  } catch (e) {
    console.log('UBQ createAccount ERROR : ', e);
    return null;
  }
}

exports.createAddress = async function (account) {
  console.log('createAccount: ', account);
  let apiUrl = configs.node_api_url.UBQ + "/api/v1/create_account_pk";

  let options = {
    method: 'POST',
    uri: apiUrl,
    body: {
      accountname: account
    },
    json: true
  }

  try {
    let res = await rp(options);
    console.log(res);

    return res.data.address;
  } catch (e) {
    console.log('UBQ createAccount ERROR : ', e);
    return null;
  }
}

exports.getBlockNumber = async function () {
  let apiBlockUrl = configs.node_api_url.UBQ + "/api/getblocknumber";
  let balanceOptions = {
    method: 'GET',
    uri: apiBlockUrl,
    headers: {

    },
    json: true
  }

  try {
    let ret = await rp(balanceOptions);
    console.log(ret);

    return {status: 'ok', blocknumber: ret};
  } catch (e) {
    console.log('get UBQ balance ERROR : ', e);
    return {status: 'fail'};
  }
}

exports.getBalance = async function (account, symbol) {
  // console.log('account: ', account);
  let apiBalanceUrl = configs.node_api_url.UBQ + "/api/get_address_balance/" + account;

  let balanceOptions = {
    method: 'GET',
    uri: apiBalanceUrl,
    headers: {

    },
    json: true
  }

  try {
    let ret = await rp(balanceOptions);
    console.log(ret);

    if (ret.status == 'fail') {
      throw new error();
    }

    return {status: 'ok', address: account, balance: ret.balance};
  } catch (e) {
    console.log('get UBQ balance ERROR : ', e);
    return {status: 'fail', address: account, balance: 0};
  }
}

exports.getBalanceByAddress = async function (address, symbol) {
  let apiBalanceUrl = configs.node_api_url.UBQ + "/api/get_address_balance/" + address;

  let balanceOptions = {
    method: 'GET',
    uri: apiBalanceUrl,
    headers: {

    },
    json: true
  }

  try {
    let ret = await rp(balanceOptions);
    console.log(ret);

    if (ret.status == 'fail') {
      return {status: 'fail', address: address, balance: 0};
    }

    return {status: 'ok', address: address, balance: ret.balance};
  } catch (e) {
    console.log('get ETH balance ERROR : ', e);
    return {status: 'fail', address: address, balance: 0};
  }
}

exports.listTransactions = async function (coin='UBQ', address, pageNumber=0, pageSize=50) {
  if (!coin || !address) {
    return null;
  }

  let apiUrl = "https://ubiqexplorer.com/api/Transaction?address=" + address + "&symbol=" + coin + "&pageNumber=" + pageNumber + "&pageSize=" + pageSize;

  let options = {
    method: 'GET',
    uri: apiUrl,
    headers: {

    },
    json: true
  }

  try {
    let ret = await rp(options);
    return ret;
  } catch(e) {
    console.log('get transaction list by address error: ', e);
    return null;
  }
}

exports.listTransactionsByAddress = async function (coin='UBQ', address, pageNumber=0, pageSize=50) {
  if (!coin || !address) {
    return null;
  }

  let apiUrl = "https://ubiqexplorer.com/api/Transaction?address=" + address + "&symbol=" + coin + "&pageNumber=" + pageNumber + "&pageSize=" + pageSize;

  let options = {
    method: 'GET',
    uri: apiUrl,
    headers: {

    },
    json: true
  }

  try {
    let ret = await rp(options);
    return ret;
  } catch(e) {
    console.log('get transaction list by address error: ', e);
    return null;
  }
}

exports.sendFromAddress = async function(from, to, value, fromAccount, symbol='UBQ') {
  let apiUrl = configs.node_api_url.UBQ + "/api/v1/sendfrompk";

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
  try {
    let res = await rp(options);
    return {status: "success", data: {txhash: res.hash}};
  } catch (e) {
    console.log('ethereum.js line 92 : ', e);
    return {status: "fail", error: e};
  }
}

exports.sendManyFromAccount = async function(from, toaddresses, extra, symbol='UBQ') {
  let apiUrl = configs.node_api_url.UBQ + "/api/v1/sendfrompk";
  let txhashes = {};

  const keys = Object.keys(toaddresses);
  console.log('keys : ', keys);

  for (let i = 0; i < keys.length; i++) {
    let receiver = keys[i];
    console.log('receiver: ', receiver);

    options = {
      method: 'POST',
      uri: apiUrl,
      body: {
        from: from,
        to: keys[i],
        value: toaddresses[keys[i]]
      },
      json: true
    }

    console.log("options ", options);

    try {
      let res = await rp(options);
      txhashes[receiver] = res.hash;
      // sleep.msleep(1000);
      await delay(2000);
    } catch (e) {
      console.log('Transfer ERROR : ', receiver);
      txhashes[receiver] = '';
    }
  }
  console.log('txhash : ', txhashes);

  return {status: "ok", data: {txhash: txhashes}};
}

exports.sendFromAccount = async function(from, to, value, confirm, symbol="UBQ", fee=true) {
  let apiUrl = configs.node_api_url.UBQ + "/api/v1/sendfrompk";

  let options = {
    method: 'POST',
    uri: apiUrl,
    body: {
      from: from,
      to: to,
      value: value,
      fee: fee
    },
    json: true
  }

  console.log("options ", options);
  let res = await rp(options);

  if (res.status == 'fail') {
    console.log(res);
    return {status: "fail", error: res.msg};
  }

  return {status: "ok", data: {txhash: res}};
}
