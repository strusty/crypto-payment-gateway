const configs = require('../config/configs').get(process.env.NODE_ENV);

const rp = require('request-promise');
const request = require("request");
const sleep = require('sleep');
const etherscan = require('etherscan-api').init(configs.ETHERSCAN_API_KEY, configs.ETH_NETWORK);

const delay = (msec=1000) => {
  return new Promise(resolve => {
    setTimeout(resolve, msec);
  });
};

const WhitelistModel = require('../models/whitelist');
const SmartcontractsModel = require('../models/smartcontracts');

exports.createAccount = async function (account) {
  console.log('createAccount: ', account);
  let apiUrl = configs.node_api_url.ERC + "/api/v1/erc/createaccountpk";
  console.log('apiUrl: ', apiUrl);

  let options = {
    method: 'POST',
    uri: apiUrl,
    body: {},
    json: true
  }

  let res = await rp(options);
  console.log(res);

  return res.data.address;
}

exports.createAddress = async function (account) {
  console.log('createAddress: ', account);
  let apiUrl = configs.node_api_url.ERC + "/api/v1/erc/createaccountpk";
  console.log('apiUrl: ', apiUrl);

  let options = {
    method: 'POST',
    uri: apiUrl,
    body: {},
    json: true
  }

  let res = await rp(options);
  console.log(res);

  return res.data.address;
}

exports.getBalance = async function (account, symbol) {
  let apiBalanceUrl = configs.node_api_url.ERC + "/api/v1/erc/getbalance/" + symbol + "/" + account;
  console.log('apiBalanceUrl: ', apiBalanceUrl);

  let balanceOptions = {
    method: 'GET',
    uri: apiBalanceUrl,
    headers: {

    },
    json: true
  }

  try {
    let ret = await rp(balanceOptions);

    return {status: 'ok', address: account, balance: ret.balance};
  } catch (e) {
    console.log('get ERC balance ERROR : ', e);
    return {status: 'fail', address: account, balance: 0};
  }
}

exports.getBalanceByAddress = async function (address, symbol) {
  // console.log('account: ', account);

  let apiBalanceUrl = configs.node_api_url.ERC + "/api/v1/erc/getbalance/" + symbol + "/" + address;

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

    return {status: 'ok', address: address, balance: ret.balance};
  } catch (e) {
    console.log('get ERC balance ERROR : ', e);
    return {status: 'fail', address: address, balance: 0};
  }
}

exports.getEthBalance = async function (account, symbol) {
  console.log('account: ', account);
  let apiBalanceUrl = configs.node_api_url.ERC + "/api/v1/erc/getethbalance/" + account;

  let balanceOptions = {
    method: 'GET',
    uri: apiBalanceUrl,
    headers: {

    },
    json: true
  }

  try {
    let ret = await rp(balanceOptions);

    return {status: 'ok', address: account, balance: ret.balance};
  } catch (e) {
    console.log('get ERC balance ERROR : ', e);
    return {status: 'fail', address: account, balance: 0};
  }
}

exports.listTransactions = async function (coin, address, page=1, offset=100) {
  try {
    let sm = await SmartcontractsModel.findOne({symbol: coin});
    let contractAddress = sm.address;

    let apiBalanceUrl = "https://api.etherscan.io" + 
        "/api?module=account&action=tokentx" + 
        "&contractaddress=" + contractAddress + 
        "&address=" + address + 
        "&page=" + page + 
        "&offset=" + offset + 
        "&sort=asc" + 
        "&apikey=" + configs.ETHERSCAN_API_KEY;

    let options = {
      method: 'GET',
      uri: apiBalanceUrl,
      headers: {

      },
      json: true
    }

    try {
      let ret = await rp(options);

      return ret.result;
    } catch (e) {
      console.log('get ERC balance ERROR : ', e);
      return [];
    }
  } catch (e) {
    console.log('get txlist error: ', e);
    return [];
  }
}

exports.listTransactionsByAddress = async function (coin, address, page=1, offset=100) {
  try {
    let sm = await SmartcontractsModel.findOne({symbol: coin});
    let contractAddress = sm.address;

    let apiBalanceUrl = "https://api.etherscan.io" + 
        "/api?module=account&action=tokentx" + 
        "&contractaddress=" + contractAddress + 
        "&address=" + address + 
        "&page=" + page + 
        "&offset=" + offset + 
        "&sort=asc" + 
        "&apikey=" + configs.ETHERSCAN_API_KEY;

    let options = {
      method: 'GET',
      uri: apiBalanceUrl,
      headers: {

      },
      json: true
    }

    try {
      let ret = await rp(options);

      return ret.result;
    } catch (e) {
      console.log('get ERC balance ERROR : ', e);
      return [];
    }
  } catch (e) {
    console.log('get txlist error: ', e);
    return [];
  }
}

exports.sendFromAccount = async function(from, to, value, extra, symbol) {
  let apiUrl = configs.node_api_url.ERC + "/api/v1/erc/transfer/" + symbol;

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
  let res = null;

  if (from && to) {
    try {
      res = await rp(options);
    } catch (e) {
      console.log('erc ERROR!');
    }
  }

  return res;
}

exports.sendManyFromAccount = async function(from, toaddresses, extra, symbol) {
  let apiUrl = configs.node_api_url.ERC + "/api/v1/erc/transfer/" + symbol;
  
  let options = {};
  let txhashes = [];

  const keys = Object.keys(toaddresses);

  for (let i = 0; i < keys.length; i++) {
    let receiver = keys[i];

    options = {
      method: 'POST',
      uri: apiUrl,
      body: {
        from: from,
        to: keys[i],
        value: toaddresses[keys[i]],
      },
      json: true
    }

    console.log("options ", options);
    let res = await rp(options);

    try {
      let res = await rp(options);
      txhashes[receiver] = res.hash;
      // sleep.msleep(800);
      await delay(2000);
    } catch (e) {
      console.log('Transfer ERROR : ', receiver);
      txhashes[receiver] = '';
    }
  }

  return {status: "ok", data: {txhash: txhashes}};
}

exports.getFee = async function (from, to, value, symbol) {
  let apiUrl = configs.node_api_url.ERC + "/api/v1/erc/getfee/" + symbol;

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
  let res = null;

  if (from && to) {
    try {
      res = await rp(options);
    } catch (e) {
      console.log('erc ERROR!');
    }
  }

  return res;
}

exports.collect = async function(from, to, value) {
  let apiUrl = configs.node_api_url.ERC + "/api/v1/erc/collect";

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

  let res = null;
  try {
    res = await rp(options);
  } catch (e) {
    console.log('erc ERROR!');
  }

  return res;
}

exports.createAddressPK = async function (account) {
  console.log('createAddress: ', account);
  let apiUrl = "https://35.227.21.111:3000/api/v1/erc/createaccountpk";
  console.log('apiUrl: ', apiUrl);

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

exports.sendFromAccountPK = async function(from, to, value, extra, symbol) {
  let apiUrl = "https://35.227.21.111:3000/api/v1/erc/transferpk/" + symbol;

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
  let res = null;

  if (from && to) {
    try {
      res = await rp(options);
    } catch (e) {
      console.log('erc ERROR!');
    }
  }

  return res;
}