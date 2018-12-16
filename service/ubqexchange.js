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
  console.log('ipn_url : ', decodeURIComponent(url));
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
      console.log('Sent IPN');
    });
  } catch (e) {
    console.log('IPN ERROR : ', e);
  }
}

async function updateUbqExchange() {
  TransactionsModel.find({completed: 0, currency2: 'UBQ', transaction_type: 'exchange'}).then(async function (transactions) {
    for (let i = 0; i < transactions.length; i++) {
      let transaction = transactions[i];
      let depositedAddress = transaction.depositAddress;
      let depositedAccount = transaction.depositAccount;
      let depositedCurrency = transaction.currency2;
      let coinmodule = await CoinUtils.getCoinModule(depositedCurrency);

      const adminConfigs = await AdminConfigModel.findOne({merchant: transaction.merchant, status: true});

      if (transaction.status == -100) {
        let balances = await coinmodule.getBalance(depositedAddress);
        let balance = balances.balance;
        console.log('eth balance : ', transaction.txn_id, balances, balance);

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
            email: transaction.email,
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
          transaction.save()
            .then(t => {
              if (transaction.allow_ipn) {
                returnStatus (status, transaction.ipn_url);
              }
            })
            .catch(e => {
              console.log('Failed to update transaction status, Will resend this transaction status via IPN : ', e);
            });
        } else {
          if (balance > 0) {
            let need_more_amount = Number(parseFloat(Number(transaction.wanted_coin_amount) - balance).toFixed(8));
            let txid = '';

            let fee_amount = Number(parseFloat(balance * configs.SYSTEM_FEE).toFixed(8));

            if (transaction.commission_status != 1) {
              try {
                let tx = await coinmodule.sendFromAccount(depositedAddress, configs.commission_account.UBQ.address, fee_amount, '');
                console.log('fee tx : ', tx);

                if (tx.status == 'ok') {
                  let calculated_balance = Number(parseFloat(balance - Number(fee_amount)).toFixed(8));
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
                      received_amount: balance,
                      net: calculated_balance,
                      received_confirm: configs.CONFIRM_COUNT,
                      merchant: transaction.merchant,
                      need_more_amount: need_more_amount,
                      fee_tx: tx.data.txhash.hash
                    };

                    transaction.status = 3;
                    transaction.status_text = 'Underpaid';
                    transaction.need_more_amount = need_more_amount;
                  } else if (need_more_amount < 0) {
                    let status = {
                      status: 5,
                      status_text: 'Overconvert',
                      txn_id: transaction.txn_id,
                      currency1: transaction.currency1,
                      currency2: transaction.currency2,
                      amount1: transaction.amount,
                      amount2: transaction.amount2,
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
                      fee_tx: tx.data.txhash.hash
                    };

                    transaction.status = 5;
                    transaction.status_text = 'Overconvert';
                    transaction.need_more_amount = 0;
                  } else {
                    let status = {
                      status: 4,
                      status_text: 'Funds received and confirmed, sending to you shortly...',
                      txn_id: transaction.txn_id,
                      currency1: transaction.currency1,
                      currency2: transaction.currency2,
                      amount1: transaction.amount,
                      amount2: transaction.amount2,
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
                      fee_tx: tx.data.txhash.hash
                    };

                    transaction.status = 4;
                    transaction.status_text = 'Funds received and confirmed, sending to you shortly...';
                    transaction.need_more_amount = 0;
                  }

                  transaction.amount2 = balance;
                  transaction.fee_tx = tx.data.txhash.hash;
                  transaction.net = calculated_balance;
                  transaction.commission_status = 1;
                  transaction.save()
                    .then(t => {
                      if (transaction.allow_ipn) {
                        returnStatus (status, transaction.ipn_url);
                      }
                    })
                    .catch(e => {
                      console.log('Failed to update the transaction status, Will resend this transaction status via IPN : ', e);
                    });
                }
              } catch (e) {
                console.log('Transferring ETH to commission ERROR : ', e);
              }
            }
          }
        }
      } else if (transaction.status == 3 || transaction.status == 4 || transaction.status == 5) {
        let balances = await coinmodule.getBalance(depositedAddress);
        let balance = balances.balance;

        console.log('eth balance : ', transaction.txn_id, balances, balance);

        let company_amount = balance;
        console.log('company amount ubiq : ', company_amount);
        if (company_amount > 0.0001) {
          let company_address = adminConfigs.addresses.UBQ;

          try {
            let company_tx = await coinmodule.sendFromAccount(depositedAddress, company_address, company_amount, '');
            console.log('comapny tx: ', company_tx);

            if (company_tx && company_tx.status =='ok' && company_tx.data.txhash) {
              console.log('company_tx: ', company_tx.data.txhash);

              let sms_body = 'Hello Wbex.';
              sms_body += 'Transferred ' + company_amount + ' ETH from Payment of ' + transaction.txn_id + ' for company. You can check with this transaction hash ' + company_tx.data.txhash.hash;
              nexmo.message.sendSms('chaintx.io', '+18632281750', sms_body);

              if (transaction.status == 3 || transaction.status == 5) {
                let coinPrices = await CoinpricesModel.findOne({});
                transaction.amount = parseFloat((company_amount - 2 * configs.TRANSACTION_FEE[transaction.currency2]) * coinPrices[transaction.currency2] / (coinPrices[transaction.currency1] * coinPrices['ETH'])).toFixed(8);
              }

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
                net: company_amount,
                received_amount: transaction.received_amount,
                received_confirm: configs.CONFIRM_COUNT,
                merchant: transaction.merchant,
                company_tx: company_tx.data.txhash.hash
              };

              transaction.completed = 0;
              transaction.status = 10;
              transaction.status_text = 'User deposit completed';
              transaction.company_tx = company_tx.data.txhash.hash;
              transaction.net = company_amount;
              transaction.save()
                .then(t => {
                  if (transaction.allow_ipn) {
                    returnStatus (status, transaction.ipn_url);
                  }
                })
                .catch(e => {
                  console.log('Failed to update the transaction status, Will resend this transaction status via IPN : ', e);
                });
            }
          } catch (e) {
            console.log('ETH error : ', e);
          }
        }
      } else if (transaction.status == 10) {
        let coinmodule2 = await CoinUtils.getCoinModule(transaction.currency1);

        if (coinmodule2) {
          let return_tx = await coinmodule2.sendFromAccount(adminConfigs.masterAddress[transaction.currency1], transaction.address, transaction.amount, configs.CONFIRM_COUNT, transaction.currency1);
          console.log('return_tx : ', return_tx );

          if (return_tx && return_tx.hash) {
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

            transaction.completed = 1;
            transaction.status = 99;
            transaction.status_text = 'Exchange Complete';
            transaction.return_tx = return_tx.hash;

            await transaction.save();

            if (transaction.allow_ipn) {
              returnStatus (status, transaction.ipn_url);
            }
          }
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
          net: transaction.net,
          received_amount: transaction.amount2,
          received_confirm: configs.CONFIRM_COUNT,
          merchant: transaction.merchant,
          comapny_tx: transaction.comapny_tx,
          return_tx: transaction.return_tx
        };

        transaction.completed = 1;
        transaction.status = 100;
        transaction.save()
          .then(t => {
            if (transaction.allow_ipn) {
              returnStatus (status, transaction.ipn_url);
            }
          })
          .catch(e => {
            console.log('Failed to update the transaction status, Will resend this transaction status via IPN : ', e);
          });
      } else if (transaction.status == 100) {

      } else {

      }
    }
  });
}

module.exports.updateUbqExchange = updateUbqExchange;