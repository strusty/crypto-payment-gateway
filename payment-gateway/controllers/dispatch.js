const randomstring = require('randomstring');
const qr = require('qr-image');

require('dotenv').config();
const configs = require('../config/configs').get(process.env.NODE_ENV);
const CoinUtils = require('../utils/coins');

const TransactionsModel = require('../models/transactions');
const CoinpricesModel = require('../models/coinprice');
const WhitelistModel = require('../models/whitelist');
const AdminConfigsModel = require('../models/AdminConfigs');

const emailUtils = require('../utils/emailservice');
const authUtils = require('../utils/authUtils');

exports.grGenerate = function (req, res) {
  let txn_id = req.params.txn_id;
  let address = req.params.address;
  let amount = req.query.amount;
  let qrcode = null;

  if (!amount) {
    qrcode = qr.imageSync(address);
  } else {
    qrcode = qr.imageSync(address + '?amount=' + amount);
  }

  res.send(qrcode);
}

exports.getqrcode = function (req, res) {
  let address = req.params.address;

  let qrcode = qr.imageSync(address);

  res.send(qrcode);
}

exports.getStatus = function (req, res) {
  let address = req.params.address;
  let txn_id = req.params.txn_id;

  TransactionsModel.findOne({txn_id: txn_id})
    .then(async function (transaction) {
      if (!transaction) {
        return res.status(200).json({status: false, data: {msg: 'Failed to get transaction of ' + txn_id}});
      }

      let status = {
        status: transaction.status,
        status_text: transaction.status_text,
        completed: transaction.completed,
        txn_id: transaction.txn_id,
        currency1: transaction.currency1,
        currency2: transaction.currency2,
        amount1: transaction.amount,
        amount2: transaction.amount2,
        fee: transaction.fee_amount,
        buyer_name: transaction.buyer_name,
        email: transaction.buyer_email,
        item_name: transaction.item_name,
        item_number: transaction.item_number,
        inv_id: transaction.inv_id,
        invoice: transaction.invoice,
        custom: transaction.custom,
        received_amount: transaction.received_amount,
        received_confirm: transaction.received_confirm
      };

      return res.status(200).json({status: true, data: status});
    })
    .catch(function (error) {
      return res.status(200).json({status: false, data: {error: error, msg: 'Failed to get transaction status of ' + txn_id}});
    });
}

exports.getBklockNumber = async function (req, res) {
  let coin = req.params.coin;

  let coinmodule = await CoinUtils.getCoinModule(coin);
  let blockNumber = await coinmodule.getBlockNumber();
  res.status(200).json({status: true, result: result});
}

exports.getBalance = async function (req, res) {
  let coin = req.body.coin;
  let address = req.body.address;

  if (!address || address == '') {
    return res.status(200).json({status: false, balance: {address: '', balance: 0}, msg: 'Invalid address'});
  }

  let coinmodule = await CoinUtils.getCoinModule(coin);
  let currentBalance = await coinmodule.getBalance(address, coin);
  console.log('currentBalance: ', currentBalance);

  res.status(200).json({status: true, balance: currentBalance});
}

exports.getBalanceByAddress = async function (req, res) {
  let coin = req.body.coin;
  let address = req.body.address;

  if (!address || address == '') {
    return res.status(200).json({status: false, balance: {address: '', balance: 0}, msg: 'Invalid address'});
  }

  let coinmodule = await CoinUtils.getCoinModule(coin);
  let currentBalance = await coinmodule.getBalanceByAddress(address, coin);
  console.log('currentBalance: ', currentBalance);

  res.status(200).json({status: true, balance: currentBalance});
}

exports.getBalanceListByEmail = async function (req, res) {
  let buyer_email = req.body.buyer_email;
  console.log('buyer_email : ', buyer_email);

  if (!buyer_email || buyer_email == '') {
    return res.status(200).json({status: false, msg: 'Invalid buyer_email'});
  }

  let addressList = await WhitelistModel.find({buyer_email: buyer_email});
  let balances = [];
  console.log('addressList : ', addressList);

  for (let i = 0; i < addressList.length; i++) {
    let address = addressList[i];

    let coinmodule = await CoinUtils.getCoinModule(address.symbol);
    let coinBalance = await coinmodule.getBalanceByAddress(address.address, address.symbol);
    console.log('coinBalance : ', coinBalance);

    balances.push({
      coin: address.symbol,
      address: address.address,
      balance: coinBalance.balance
    })
  }
  
  res.status(200).json({status: true, balance: balances});
}

exports.getTransactionList = async function (req, res) {
  let coin = req.body.coin;
  let address = req.body.address;
  let page = req.body.page;
  let offset = req.body.offset;

  let coinmodule = await CoinUtils.getCoinModule(coin);

  try {
    console.log('req.body: ', req.body);
    let transactions = null;
    if (page > 0 && offset > 0) {
      transactions = await coinmodule.listTransactions(coin, address, page, offset);
    } else {
      transactions = await coinmodule.listTransactions(coin, address);
    }
    res.status(200).json({status: true, transactions: transactions});
  } catch (e) {
    console.log('getTransactionList error : ', e);
    res.status(200).json({status: false, message: 'Failed to get transaction list of ' + address});
  }
}

exports.getTransactionListByAddress = async function (req, res) {
  let coin = req.body.coin;
  let address = req.body.address;
  let page = req.body.page;
  let offset = req.body.offset;

  let coinmodule = await CoinUtils.getCoinModule(coin);

  try {
    console.log('req.body: ', req.body);

    if (!account) {
      return res.status(200).json({status: false, msg: 'invalid address.'});
    }

    transactions = await coinmodule.listTransactionsByAddress(coin, address, page, offset);

    res.status(200).json({status: true, transactions: transactions});
  } catch (e) {
    console.log('getTransactionList error : ', e);
    res.status(200).json({status: false, message: 'Failed to get transaction list of ' + address});
  }
}

exports.createUserAccount = async function (req, res) {
  var coin = req.body.coin;
  var buyer_email = req.body.buyer_email || null, wl = null;
  console.log('buyer_email : ', buyer_email);

  let account = coin + randomstring.generate({
    length: 44 - coin.length,
    charset: 'alphanumeric'
  });

  if (!coin) {
    console.log("createUserAccount error: Invalid parameter");
    res.status(200).json({ status: false, msg: "Invalid parameter" });
    return;
  }

  try {
    wl = await WhitelistModel.findOne({buyer_email: buyer_email, symbol: coin});
    console.log('wl : ', wl);

    var coinmodule = await CoinUtils.getCoinModule(coin);
    if (!coinmodule) {
      console.log("createUserAccount error: cannot find coin name");
      res.status(200).json({ status: false, msg: "cannot find coin" });
      return;
    }

    if (wl) {
      res.status(200).json({ status: true, data: {symbol: coin, address: wl.address, accountname: wl.account, buyer_email: wl.buyer_email}});
    } else {
      var info = await coinmodule.createAccount(account);

      let whitelist = new WhitelistModel({
        address: info,
        account: account,
        buyer_email: buyer_email,
        symbol: coin
      });

      whitelist.save()
        .then(w => {
          console.log('Added new address to whitelist : ', info);
        });
      res.status(200).json({ status: true, data: {symbol: coin, address: info, accountname: account, buyer_email: buyer_email}});
    }
  } catch (e) {
    res.status(400).json({ status: false, error: e });
    return;
  }
}

exports.transfer = async function (req, res) {
  var coin = req.body.coin;
  var from = req.body.from;
  var to = req.body.to;
  var value = req.body.value;
  var buyer_email = req.body.buyer_email || null;

  var coinmodule = await CoinUtils.getCoinModule(coin);
  if (!coinmodule) {
    console.log("transfer error: cannot find coin");
    res.status(400).json({ status: false, msg: "cannot find coin" });
    return;
  }

  if (value < 0.00001) {
    res.status(200).json({ status: false, msg: "This transaction don`t allow because of too small amount." });
  }

  authUtils.checkWhitlist(from, async function (error, white) {
    if (error) {
      console.log(error);
      return res.status(200).json({status: false, msg: error});
    }

    try {
      console.log('buyer_email: ', buyer_email, white.buyer_email);
      if (buyer_email != null && white.buyer_email == buyer_email) {
        result = await coinmodule.sendFromAccount(from, to, value, configs.CONFIRM_COUNT, coin, false);

        res.status(200).json(result);
      } else {
        res.status(200).json({ status: false, data: { msg: 'This address is not allowed for withdrawal.' }});
      }
    }
    catch(e) {
      console.log("transfer error: ", e);
      res.status(400).json({ status: false, msg: e });
    }
  });
}

exports.createExchange = async function (req, res) {
  console.log("createExchange ", req.body);
  const amount = req.body.amount;
  const currency1 = req.body.currency1;
  const currency2 = req.body.currency2;
  let address = req.body.address;
  let buyer_email = req.body.buyer_email;
  let buyer_name = req.body.buyer_name;
  let item_name = req.body.item_name;
  let item_number = req.body.item_number;
  let inv_id = req.body.inv_id;
  let invoice = req.body.invoice;
  let custom = req.body.custom;
  let ipn_url = req.body.ipn_url;
  const allow_ipn = req.body.allow_ipn || true;
  const merchant = req.body.merchant || configs.MERCHANT;

  if (!currency2 || !currency1 || !amount) {
    console.log('missing params.');
    return res.status(400).json({status: false, msg: "missing params."});
  }

  if (currency2 != 'BTC' && currency2 != 'ETH' && currency2 != 'UBQ') {
    return res.status(200).json({status: false, msg: 'Unsupported coin.'})
  }

  if (!address) {
    res.status(400).json({ status: false, result: { msg: "cannot get address to send the funds" }});
    return;
  }

  try {
    const coinmodule = await CoinUtils.getCoinModule(currency2);
  
    if (!coinmodule) {
      console.log("createExchange error: cannot find network");
      res.status(400).json({ status: false, msg: "cannot find network" });
      return;
    }

    const adminConfigs = await AdminConfigsModel.findOne({merchant: merchant, status: true});
    const depositAccount = adminConfigs.depositAccount;

    let depositAddress = await coinmodule.createAccountPK(depositAccount);
    console.log('depositAddress : ', depositAddress, depositAccount);

    if (!depositAddress) {
      res.status(400).json({ status: false, msg: "cannot get deposit address" });
      return;
    }

    let txn_id = randomstring.generate(48);
    let confirms_needed = 2;
    let timeout = configs.TIMEOUT; // 6 hours

    let status_url = configs.serverip + '/status/' + txn_id + '/' + depositAddress;
    let qrcode_url = '';

    if (!ipn_url || ipn_url == '') {
      ipn_url = adminConfigs.ipn_url;
    }

    CoinpricesModel.findOne({})
      .then(function (coinPrices) {
        let currencyAmount = 0;
        if (currency1 == 'WBT' || currency1 == 'WBTx') {
          currencyAmount = parseFloat(amount * coinPrices[currency1] * coinPrices['ETH'] / coinPrices[currency2] + configs.TRANSACTION_FEE[currency2] * 2).toFixed(8);
        } else {
          currencyAmount = parseFloat(amount * coinPrices[currency1] / coinPrices[currency2] + configs.TRANSACTION_FEE[currency2] * 2).toFixed(8);
        }

        if (currency2 == 'BTC') {
          qrcode_url = configs.serverip + '/qrgen/' + txn_id + '/bitcoin:' + depositAddress + '?amount=' + currencyAmount;
        } else {
          qrcode_url = configs.serverip + '/qrgen/' + txn_id + '/' + depositAddress;
        }

        if (currencyAmount < 0.0001) {
          res.status(200).json({ status: false, msg: 'This exchange don`t allow because of too small amount.' });
        }

        let transaction = new TransactionsModel({
          amount: amount,
          currency1: currency1,
          currency2: currency2,
          address: address,
          buyer_email: buyer_email,
          buyer_name: buyer_name,
          item_name: item_name,
          item_number: item_number,
          inv_id: inv_id,
          invoice: invoice,
          custom: custom,
          ipn_url: ipn_url, 
          depositAddress: depositAddress, 
          depositAccount: depositAccount, 
          txn_id: txn_id, 
          confirms_needed: confirms_needed, 
          timeout: timeout, 
          status_url: status_url, 
          qrcode_url: qrcode_url,
          wanted_coin_amount: currencyAmount,
          merchant: adminConfigs.merchant,
          allow_ipn: allow_ipn,
          transaction_type: 'exchange'
        });

        transaction.save()
          .then(function (data) {
            let result = {
              status: true,
              result: {
                amount: currencyAmount,
                address: depositAddress,
                txn_id: txn_id,
                confirms_needed: confirms_needed,
                timeout: timeout,
                status_url: status_url,
                qrcode_url: qrcode_url
              }
            };

            emailUtils.newPaymentSubittedNotification([{address:'bingf28@yahoo.com'}, {address:'nicholus@gmail.com'}], 'WBEX', currencyAmount, currency2, txn_id);

            res.status(200).json(result);
          }).catch(function (err) {
            console.log('Failed to save transaction to DB : ', err);
            res.status(400).json({ status: false, msg: 'failed to create transaction.' });
          });
            
      }).catch(function (error) {
        console.log(error);
        res.status(400).json({ status: false, msg: 'failed to get coin price.' });
      });
  }
  catch(e) {
    console.log("createExchange error: ", e);
    res.status(400).json({ status: false, msg: e });
  }
}

exports.sendMany = async function (req, res) {
  let from = req.body.from;
  let toAddresses = req.body.toaddresses;
  let coin = req.body.coin;
  console.log('toAddresses : ', JSON.stringify(toAddresses));

  var coinmodule = await CoinUtils.getCoinModule(coin);

  authUtils.checkWhitlist(from, async function (error, status) {
    if (error) {
      console.log(error);
      return res.status(200).json({status: false, data: {msg: "Disallow operation on this address."}});
    }

    try {
      result = await coinmodule.sendManyFromAccount(from, toAddresses, configs.CONFIRM_COUNT, coin);

      if (result.status != "success") {
        res.status(400).json(result);
      }
      else {
        res.status(200).json(result);
      }
    }
    catch(e) {
      console.log("transfer error: ", e);
      res.status(400).json({ status: false, data: { msg: e }});
    }
  });
}

exports.recollect = async function (req, res) {
  const csv = require("fast-csv");
  var fs = require('fs');
  var stream = fs.createReadStream("/tmp/my.csv");
  const sleep = require('sleep');

  let coin = req.params.coin;
  let successTx = [];
  let failedAddress = [];
  let addresses = [];

  try {
    var csvStream = csv
    .parse()
    .on("data", function(data){
      console.log(data);
      let address = data[0];
      if (address) {
        addresses.push(address);
      }
    })
    .on("end", async function(){
      try {
        var coinmodule1 = await CoinUtils.getCoinModule('ETH');
        var coinmodule2 = await CoinUtils.getCoinModule('BIXCPRO');

        for (let i = 0; i < addresses.length; i++) {
          let currentBalance = await coinmodule1.getBalance(addresses[i], 'ETH');

          if (currentBalance.balance > 0) {
            
            let result = await coinmodule2.collect(addresses[i], '0x19b3c1feA6a8C770Be03e3B61AD02f6A3E464765', currentBalance.balance);

            if (result.status != "success") {
              console.log(result);
              successTx.push(result);
            }
            else {
              console.log('Failed : ', addresses[i], currentBalance.balance);
              failedAddress.push(addresses[i]);
            }
          }
          sleep.msleep(800);
        }
      } catch(e) {
        console.log('ERROR!!!');
      }
      console.log("done");
      res.status(200).json({status: 'success', successTx: successTx, failedAddress: failedAddress});
    });
 
    stream.pipe(csvStream);
  } catch(e) {
    console.log('create transaction');
    console.log(e);
    res.status(200).json({status: 'failed'});
  }
}

exports.getCoinPrices = function (req, res) {
  const coin = req.body.coin || null;

  CoinpricesModel.findOne({})
    .then(function (coinPrices) {
      if (coin) {
        res.status(200).json({status: true, data: coinPrices[coin]});
      } else {
        res.status(200).json({status: true, data: coinPrices});
      }
    })
    .catch(function (e) {
      res.status(200).json({status: false, msg: 'Failed to get coin prices.'});
    });
}
