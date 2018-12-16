let BitcoinModule = require('../modules/bitcoin');
let EthereumModule = require('../modules/ethereum');
let ErcModule = require('../modules/erc');
let UbiqModule = require('../modules/ubiq');
let UbiqErcModule = require('../modules/ubiqerc');

let SmartcontractsModel = require('../models/smartcontracts');

require('dotenv').config();
let configs = require('../config/configs').get(process.env.NODE_ENV);

coinmodules = [
  BitcoinModule,
  EthereumModule,
  ErcModule,
  UbiqModule,
  UbiqErcModule,
];

exports.coinModuleList = coinmodules;

exports.getCoinModule = async function (network) {
  let sm = await SmartcontractsModel.findOne({symbol: network});
  if (sm && sm != null && sm.symbol == network) {
    if (sm.parent == 'UBQ') {
      return UbiqErcModule;
    } else {
      return ErcModule;
    }
  }

  for (var i = 0; i < configs.supportCoins.length; i++) {
    if (network == configs.supportCoins[i]) {
      return coinmodules[i];
    }
  }

  return null;
}

exports.getBalanceForAddress = async function (coin, address) {
  var coinmodule = await getCoinModule(coin);
  if (!coinmodule) {
    console.log("getBalanceForAddress error: cannot find coin");
    return { status: "fail", data: { msg: "cannot find coin" } };
  }

  var balance = coinmodule.getBalance(address);

  return {
    status: "success",
    data: {
      coin: coin,
      address: address,
      balance: balance.balance,
    }
  };
}