const curl = require('curlrequest');
const moment = require('moment');
const Nexmo = require('nexmo');

const emailUtils = require('../utils/emailservice');
const CoinUtils = require('../utils/coins');

const TransactionsModel = require('../models/transactions');
const AdminConfigModel = require('../models/AdminConfigs');
const CoinpricesModel = require('../models/coinprice');

require('dotenv').config();
const configs = require('../config/configs').get(process.env.NODE_ENV);

const nexmo = new Nexmo({
  apiKey: configs.NEXMO_KEY,
  apiSecret: configs.NEXMO_SECRET
});

function returnStatus (status, url) {
  console.log('ipn url : ', decodeURIComponent(url));
  let coption = {
    url: decodeURIComponent(url),
    method: 'POST',
    headers: {accept: 'text/*'},
    data: status,
    verbose: false,
    stderr: false
  };

  try {
    curl.request(coption, function (err, data) {
      console.log('sent status via ipn_url');
    });
  } catch (e) {
    console.log('IPN ERROR : ', e);
  }
}

function updateBtcExchange() {
  TransactionsModel.find({completed: 0, currency2: 'BTC', transaction_type: 'exchange'}).then(async function (transactions) {
    for (let i = 0; i < transactions.length; i++) {
      let transaction = transactions[i];
      let depositedAddress = transaction.depositAddress;
      let depositedAccount = transaction.depositAccount;
      let depositedCurrency = transaction.currency2;

      const adminConfigs = await AdminConfigModel.findOne({merchant: transaction.merchant, status: true});

      try {
        let coinmodule = await CoinUtils.getCoinModule(depositedCurrency);

        if (transaction.status == -100) {
          let zero_confirm_balance = await coinmodule.getReceivedByAddress(depositedAddress, 0);
          console.log('zero balance : ', depositedAddress, zero_confirm_balance);
          let balance = await coinmodule.getReceivedByAddress(depositedAddress, configs.CONFIRM_COUNT);

          if (Date.now() - moment(transaction.createdAt).unix() * 1000 > transaction.timeout && balance == 0) {
            let status = {
              status: -1,
              status_text: 'Cancelled / Timed Out',
              txn_id: transaction.txn_id,
              currency1: transaction.currency1,
              currency2: transaction.currency2,
              amount1: transaction.amount,
              amount2: 0,
              fee: 0,
              buyer_name: transaction.buyer_name,
              email: transaction.buyer_email,
              item_name: transaction.item_name,
              item_number: transaction.item_number,
              inv_id: transaction.inv_id,
              invoice: transaction.invoice,
              custom: transaction.custom,
              send_tx: '',
              received_amount: 0,
              received_confirm: 0,
              merchant: transaction.merchant,
            };

            transaction.completed = -1;
            transaction.status = -1;
            transaction.status_text = 'Cancelled / Timed Out';
            await transaction.save();

            if (transaction.allow_ipn) {
              returnStatus (status, transaction.ipn_url);
            }
          } else {
            if (zero_confirm_balance > 0) {
              let status = {
                status: 1,
                status_text: 'We have confirmed coin reception from the buyer',
                txn_id: transaction.txn_id,
                currency1: transaction.currency1,
                currency2: transaction.currency2,
                amount1: transaction.amount,
                amount2: zero_confirm_balance,
                fee: 0,
                buyer_name: transaction.buyer_name,
                email: transaction.buyer_email,
                item_name: transaction.item_name,
                item_number: transaction.item_number,
                inv_id: transaction.inv_id,
                invoice: transaction.invoice,
                custom: transaction.custom,
                send_tx: '',
                received_amount: 0,
                received_confirm: 0,
                merchant: transaction.merchant,
              };

              transaction.status = 1;
              transaction.status_text = 'We have confirmed coin reception from the buyer';
              await transaction.save();

              if (transaction.allow_ipn) {
                returnStatus (status, transaction.ipn_url);
              }
            }
          }
        } else if (transaction.status == 1) {
          let balance = await coinmodule.getReceivedByAddress(depositedAddress, configs.CONFIRM_COUNT);

          if (balance > 0) {
            let need_more_amount = parseFloat(transaction.wanted_coin_amount - balance).toFixed(8) * 1.0;
            emailUtils.coinDepositReceivedNotification([{address:'bingf28@yahoo.com'}, {address:'nicholus@gmail.com'}, {address:'stuart@worldbit.com'}], 'Wbex', balance, 'BTC',  transaction.depositAddress, '');

            let fee_amount = parseFloat(balance * configs.SYSTEM_FEE).toFixed(8) * 1.0;
            console.log('fee_amount : ', fee_amount, balance, transaction.txn_id, transaction.depositAddress);

            if (transaction.commission_status != 1) {
              let tx = await coinmodule.sendFromAccountWithoutCheck(adminConfigs.depositAccount, configs.commission_account.BTC.address, fee_amount, configs.CONFIRM_COUNT);
              console.log('fee tx: ', tx);

              if (tx && tx.status =='ok' && tx.data.txhash) {
                emailUtils.commissionNotification([{address:'bingf28@yahoo.com'}, {address:'nicholus@gmail.com'}, {address:'stuart@worldbit.com'}], 'Wbex', fee_amount, 'BTC', '', transaction.fee_tx);
                let calculated_balance = parseFloat(balance - fee_amount - configs.BTC_TRANSACTION_FEE * 1.0).toFixed(8) * 1.0;
                console.log('calculated_balance : ', calculated_balance);

                let status = {};

                if (need_more_amount > 0) {
                  status = {
                    status: 3,
                    status_text: 'Underpaid',
                    txn_id: transaction.txn_id,
                    currency1: transaction.currency1,
                    currency2: transaction.currency2,
                    amount1: transaction.amount,
                    amount2: balance,
                    fee: fee_amount,
                    buyer_name: transaction.buyer_name,
                    email: transaction.buyer_email,
                    item_name: transaction.item_name,
                    item_number: transaction.item_number,
                    inv_id: transaction.inv_id,
                    invoice: transaction.invoice,
                    custom: transaction.custom,
                    net: calculated_balance,
                    received_amount: balance,
                    received_confirm: configs.CONFIRM_COUNT,
                    need_more_amount: need_more_amount,
                    merchant: transaction.merchant
                  };

                  transaction.status = 3;
                  transaction.status_text = 'Underpaid';
                  transaction.need_more_amount = need_more_amount;
                } else if (need_more_amount < 0) {
                  status = {
                    status: 5,
                    status_text: 'Overconvert',
                    txn_id: transaction.txn_id,
                    currency1: transaction.currency1,
                    currency2: transaction.currency2,
                    amount1: transaction.amount,
                    amount2: balance,
                    fee: fee_amount,
                    buyer_name: transaction.buyer_name,
                    email: transaction.buyer_email,
                    item_name: transaction.item_name,
                    item_number: transaction.item_number,
                    inv_id: transaction.inv_id,
                    invoice: transaction.invoice,
                    custom: transaction.custom,
                    net: calculated_balance,
                    received_amount: balance,
                    received_confirm: configs.CONFIRM_COUNT,
                    merchant: transaction.merchant,
                  };

                  transaction.status = 5;
                  transaction.status_text = 'Overconvert';
                  transaction.need_more_amount = need_more_amount;
                } else {
                  status = {
                    status: 4,
                    status_text: 'Funds received and confirmed, sending to you shortly...',
                    txn_id: transaction.txn_id,
                    currency1: transaction.currency1,
                    currency2: transaction.currency2,
                    amount1: transaction.amount,
                    amount2: balance,
                    fee: fee_amount,
                    buyer_name: transaction.buyer_name,
                    email: transaction.buyer_email,
                    item_name: transaction.item_name,
                    item_number: transaction.item_number,
                    inv_id: transaction.inv_id,
                    invoice: transaction.invoice,
                    custom: transaction.custom,
                    net: calculated_balance,
                    received_amount: balance,
                    received_confirm: configs.CONFIRM_COUNT,
                    fee_tx: tx.data.txhash,
                    merchant: transaction.merchant
                  };

                  transaction.status = 4;
                  transaction.status_text = 'Funds received and confirmed, sending to you shortly...';
                  transaction.need_more_amount = 0;
                }

                transaction.fee_tx = tx.data.txhash ? tx.data.txhash : '';
                transaction.net = Number(calculated_balance);
                transaction.commission_status = 1;
                transaction.amount2 = balance;
                transaction.fee_amount = fee_amount;

                await transaction.save();

                if (transaction.allow_ipn) {
                  returnStatus (status, transaction.ipn_url);
                }
              }
            }
          }
        } else if (transaction.status == 3 || transaction.status == 5) {
          if (!transaction.company_tx || transaction.company_tx == '') {
            let company_amount = parseFloat(transaction.net - configs.BTC_TRANSACTION_FEE * 1.0).toFixed(8) * 1.0;
            let company_address = adminConfigs.addresses.BTC;
            console.log('comapny transfer : ', configs.company_account.BTC.account, company_address, company_amount, configs.BTC_TRANSACTION_FEE);

            if (transaction.company_status < 1) {
              transaction.company_status = 1;
              await transaction.save();

              try {
                let company_tx = await coinmodule.sendFromAccountWithoutCheck(adminConfigs.depositAccount, company_address, company_amount, configs.CONFIRM_COUNT);

                let company_txhash = '';

                if (company_tx && company_tx.data && company_tx.data.txhash) {
                  company_txhash = company_tx.data.txhash;

                  console.log('---------------------------------------');
                  console.log('company_tx: ', company_txhash);
                  console.log('---------------------------------------');

                  emailUtils.companySendNotification([{address:'bingf28@yahoo.com'}, {address:'nicholus@gmail.com'}, {address:'stuart@worldbit.com'}], 'Wbex', company_amount, 'BTC', transaction.txn_id, company_txhash);

                  let sms_body = 'Hello BillionexPro.';
                  sms_body += 'Transferred ' + company_amount + ' BTC from Payment of ' + transaction.txn_id + ' for company. You can check with this transaction hash ' + company_tx.data.txhash;
                  nexmo.message.sendSms('chaintx.io', '+18632281750', sms_body);
                  nexmo.message.sendSms('chaintx.io', '+16783622706', sms_body);

                  const coinPrices = await CoinpricesModel.findOne({});
                  const wbtxPrice = coinPrices.WBTX || 0;
                  transaction.amount = parseFloat((company_amount - 2 * configs.TRANSACTION_FEE[transaction.currency2]) * coinPrices[transaction.currency2] / (coinPrices[transaction.currency1] * coinPrices['ETH'])).toFixed(8);

                  let status = {
                    status: 10,
                    status_text: 'User deposit completed',
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
                    received_amount: company_amount,
                    net: company_amount,
                    received_confirm: 2,
                    merchant: transaction.merchant,
                    fee_tx: transaction.fee_tx,
                    company_tx: company_txhash
                  };

                  transaction.completed = 0;
                  transaction.status = 10;
                  transaction.status_text = 'User deposit completed';
                  transaction.company_status = 2;
                  transaction.company_tx = company_txhash;
                  transaction.net = company_amount;
                  await transaction.save();

                  console.log('deposit completed : ', transaction.txn_id);
                  if (transaction.allow_ipn) {
                    returnStatus (status, transaction.ipn_url);
                  }
                } else {
                  throw new Error('Failed to tranaction');
                }
              } catch (e) {
                console.log(e);
                transaction.company_status = 0;
                await transaction.save();
              }
            }
          } else {
            let status = {
              status: 10,
              status_text: 'User deposit completed',
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
              net: transaction.net,
              received_confirm: 2,
              merchant: transaction.merchant,
              fee_tx: transaction.fee_tx,
              company_tx: transaction.company_tx
            };

            transaction.completed = 0;
            transaction.status = 10;
            
            await transaction.save();

            if (transaction.allow_ipn) {
              returnStatus (status, transaction.ipn_url);
            }
          }
        } else if (transaction.status == 4) {
          if (!transaction.company_tx || transaction.company_tx == '') {
            let company_amount = parseFloat(transaction.net - configs.BTC_TRANSACTION_FEE * 1.0).toFixed(8) * 1.0;
            let company_address = adminConfigs.addresses.BTC;
            console.log('comapny transfer : ', configs.company_account.BTC.account, company_address, company_amount, configs.BTC_TRANSACTION_FEE);

            if (transaction.company_status < 1) {
              transaction.company_status = 1;
              await transaction.save();

              try {
                let company_tx = await coinmodule.sendFromAccountWithoutCheck(adminConfigs.depositAccount, company_address, company_amount, configs.CONFIRM_COUNT);

                let company_txhash = '';

                if (company_tx && company_tx.data && company_tx.data.txhash) {
                  company_txhash = company_tx.data.txhash;

                  console.log('---------------------------------------');
                  console.log('company_tx: ', company_txhash);
                  console.log('---------------------------------------');

                  let status = {
                    status: 10,
                    status_text: 'User deposit completed',
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
                    received_amount: company_amount,
                    net: company_amount,
                    received_confirm: 2,
                    merchant: transaction.merchant,
                    fee_tx: transaction.fee_tx,
                    company_tx: company_txhash
                  };

                  transaction.completed = 0;
                  transaction.status = 10;
                  transaction.status_text = 'User deposit completed';
                  transaction.company_status = 2;
                  transaction.company_tx = company_txhash;
                  transaction.net = company_amount;

                  await transaction.save();
                    
                  console.log('status completed : ', transaction.txn_id);
                  
                  if (transaction.allow_ipn) {
                    returnStatus (status, transaction.ipn_url);
                  }
                } else {
                  throw new Error('Failed to tranaction');
                }
              } catch (e) {
                console.log(e);
                transaction.company_status = 0;
                await transaction.save();
              }
            }
          } else {
            let status = {
              status: 10,
              status_text: 'User deposit completed',
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
              net: transaction.net,
              received_confirm: 2,
              merchant: transaction.merchant,
              fee_tx: transaction.fee_tx,
              company_tx: transaction.company_tx
            };

            transaction.completed = 0;
            transaction.status = 10;
            
            await transaction.save()
              
            console.log('status completed : ', transaction.txn_id);

            if (transaction.allow_ipn) {
              returnStatus (status, transaction.ipn_url);
            }
          }
        } else if (transaction.status == 10) {
          let coinmodule2 = await CoinUtils.getCoinModule(transaction.currency1);

          if (coinmodule2) {
            let return_tx = await coinmodule2.sendFromAccount(adminConfigs.masterAddress[transaction.currency1], transaction.address, transaction.amount, configs.CONFIRM_COUNT, transaction.currency1);
            console.log('return_tx : ', return_tx);

            if (return_tx && return_tx.hash) {
              emailUtils.companySendNotification([{address:'bingf28@yahoo.com'}, {address:'nicholus@gmail.com'}, {address:'stuart@worldbit.com'}], 'Wbex', transaction.amount, transaction.currency1, transaction.txn_id, return_tx.hash);

              let sms_body = 'Hello Wbex.';
              sms_body += 'Transferred ' + transaction.amount + ' ' + transaction.currency1 + 'from Payment of ' + transaction.txn_id + ' to user ' + transaction.buyer_email + '. You can check with this transaction hash ' + return_tx.hash;
              nexmo.message.sendSms('chaintx.io', '+18632281750', sms_body);
              nexmo.message.sendSms('chaintx.io', '+16783622706', sms_body);

              let status = {
                status: 99,
                status_text: 'Exchange Complete',
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
                net: transaction.net,
                received_confirm: 2,
                merchant: transaction.merchant,
                fee_tx: transaction.fee_tx,
                company_tx: transaction.company_tx,
                return_tx: return_tx.hash
              };

              transaction.completed = 0;
              transaction.status = 99;
              transaction.status_text = 'Exchange Complete';
              transaction.return_tx = return_tx.hash;

              await transaction.save();
                
              console.log('status completed : ', transaction.txn_id);
              
              if (transaction.allow_ipn) {
                returnStatus (status, transaction.ipn_url);
              }
            }
          } else {
            console.log('Can not find network : ', transaction.currency1);
          }
        } else if (transaction.status == 99) {
          let status = {
            status: 100,
            status_text: 'Payment Complete',
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
            received_amount: transaction.net,
            net: transaction.net,
            received_confirm: 2,
            merchant: transaction.merchant,
            fee_tx: transaction.fee_tx,
            company_tx: transaction.company_tx,
            return_tx: transaction.return_tx
          };

          transaction.completed = 1;
          transaction.status = 100;

          await transaction.save();

          if (transaction.allow_ipn) {
            returnStatus (status, transaction.ipn_url);
          }
        } else if (transaction.status == 100) {

        }
      } catch (error) {
        console.log(error);
      }
    }
  });
}

module.exports.updateBtcExchange = updateBtcExchange;