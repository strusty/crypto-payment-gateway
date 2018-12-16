const curl = require('curlrequest');
const moment = require('moment');
const Nexmo = require('nexmo');

const emailUtils = require('../utils/emailservice');
const CoinUtils = require('../utils/coins');

const TransactionsModel = require('../models/transactions');

require('dotenv').config();
const configs = require('../config/configs').get(process.env.NODE_ENV);

const nexmo = new Nexmo({
  apiKey: configs.NEXMO_KEY,
  apiSecret: configs.NEXMO_SECRET
});

function returnStatus (status, url) {
  console.log('iupn_url : ', decodeURIComponent(url));
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
      console.log('curl err : ', err);
      console.log('curl data : ', data);
    });
  } catch (e) {
    console.log('IPN ERROR : ', e);
  }
}

async function updateEthTransaction(socket) {
  TransactionsModel.find({completed: 0, currency2: 'ETH', transaction_type: {$ne: 'ico'}}).then(async function (transactions) {
    for (let i = 0; i < transactions.length; i++) {
    // transactions.forEach(async function (transaction) {
      let transaction = transactions[i];
      let depositedAddress = transaction.depositAddress;
      let depositedAccount = transaction.depositAccount;
      let depositedCurrency = transaction.currency2;
      let coinmodule = await CoinUtils.getCoinModule(depositedCurrency);

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
            merchant: configs.MERCHANT,
          };

          transaction.completed = -1;
          transaction.status = -1;
          transaction.status_text = 'Cancelled / Timed Out';
          transaction.save()
            .then(t => {
              emailUtils.coinPaymentTimeoutNotification([{address:'bingf28@yahoo.com'}, {address:'nicholus@gmail.com'}], 'BillionexPro', transaction.amount, transaction.currency1, transaction.txn_id);
              socket.emit(configs.MERCHANT, status);
              returnStatus (status, transaction.ipn_url);
            })
            .catch(e => {
              console.log('Failed to update transaction status, Will resend this transaction status via IPN : ', e);
            });
        } else {
          if (balance > 0) {
            let need_more_amount = parseFloat(Number(transaction.wanted_coin_amount) - balance).toFixed(8) * 1.0;
            let txid = '';

            // try {
            //   let txsAccount = await coinmodule.listTransactions(depositedAddress);
            //   txid = txsAccount.result[0].hash;
            // } catch (error) {
            //   console.log('get ETH list transactions : ERROR', depositedAddress, error);
            // }

            emailUtils.coinDepositReceivedNotification([{address:'bingf28@yahoo.com'}, {address:'nicholus@gmail.com'}], 'BillionexPro', balance, 'ETH', transaction.depositAddress, txid);

            if (need_more_amount > 0.0071) {
              let status = {
                status: 3,
                status_text: 'Waiting for buyers funds..., (' + balance + '/' + transaction.wanted_coin_amount + ' received with ' + configs.CONFIRM_COUNT + ' confirms)',
                txn_id: transaction.txn_id,
                currency1: transaction.currency1,
                currency2: transaction.currency2,
                amount1: transaction.amount,
                amount2: balance,
                fee: 0,
                buyer_name: transaction.buyer_name,
                email: transaction.buyer_email,
                item_name: transaction.item_name,
                item_number: transaction.item_number,
                inv_id: transaction.inv_id,
                invoice: transaction.invoice,
                custom: transaction.custom,
                send_tx: txid,
                received_amount: balance,
                received_confirm: configs.CONFIRM_COUNT,
                merchant: configs.MERCHANT,
                need_more_amount: need_more_amount,
              };

              transaction.status = 3;
              transaction.status_text = 'Waiting for buyers funds..., (' + balance + '/' + transaction.wanted_coin_amount + ' received with ' + configs.CONFIRM_COUNT + ' confirms)';
              transaction.send_tx = txid;
              transaction.amount2 = balance;
              transaction.need_more_amount = need_more_amount;
              transaction.save()
                .then(t => {
                  socket.emit(configs.MERCHANT, status);
                  returnStatus (status, transaction.ipn_url);
                })
                .catch(e => {
                  console.log('Failed to update the transaction status, Will resend this transaction status via IPN : ', e);
                });
            } else {
              let fee_amount = parseFloat(balance * configs.SYSTEM_FEE).toFixed(8) * 1.0;

              if (transaction.commission_status != 1) {
                try {
                  let tx = await coinmodule.sendFromAccount(depositedAddress, configs.commission_account.ETH.address, fee_amount, '');
                  let calculated_balance = parseFloat(balance - Number(fee_amount)).toFixed(8) * 1.0;

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
                    merchant: configs.MERCHANT,
                    send_tx: txid,
                    fee_tx: tx.data.txhash.hash
                  };

                  transaction.status = 4;
                  transaction.status_text = 'Funds received and confirmed, sending to you shortly...';
                  transaction.fee_tx = tx.data.txhash.hash;
                  transaction.net = calculated_balance;
                  transaction.amount2 = balance;
                  transaction.commission_status = 1;
                  transaction.save()
                    .then(t => {
                      socket.emit(configs.MERCHANT, status);
                      returnStatus (status, transaction.ipn_url);
                      emailUtils.commissionNotification([{address:'bingf28@yahoo.com'}, {address:'nicholus@gmail.com'}], 'BillionexPro', fee_amount, 'ETH', txid, transaction.fee_tx);
                    })
                    .catch(e => {
                      console.log('Failed to update the transaction status, Will resend this transaction status via IPN : ', e);
                    });
                } catch (error) {
                  console.log('Transferring ETH to commission ERROR : ', error);
                }
              }
            }
          }
        }
      } else if (transaction.status == 1) {

      } else if (transaction.status == 3) {
        if (Date.now() - moment(transaction.createdAt).unix() * 1000 > transaction.timeout) {
          let balances = await coinmodule.getBalance(depositedAddress);
          let balance = balances.balance;
          console.log('eth balance : ', transaction.txn_id, balances, balance);

          let fee_amount = parseFloat(balance * configs.SYSTEM_FEE).toFixed(8) * 1.0;
          try {
            let calculated_balance = parseFloat(balance - fee_amount).toFixed(8) * 1.0;
            let company_amount = parseFloat(calculated_balance - configs.ETH_TRANSACTION_FEE).toFixed(8) * 1.0;

            if (company_amount > 0.0001) {
              let vendor_address = transaction.address || configs.company_account.ETH.address;
              let tx = await coinmodule.sendFromAccount(depositedAddress, configs.commission_account.ETH.address, fee_amount, '');
              let company_tx = await coinmodule.sendFromAccount(depositedAddress, vendor_address, company_amount, '');

              if (company_tx && company_tx.status =='ok' && company_tx.data.txhash) {
                let company_txhash = company_tx.data.txhash.hash;
                emailUtils.companySendNotification([{address:'bingf28@yahoo.com'}, {address:'nicholus@gmail.com'}], 'BillionexPro', company_amount, 'ETH', transaction.txn_id, company_txhash);
                try {
                  let sms_body = 'Hello BillionexPro.';
                  sms_body += 'Transferred ' + company_amount + ' ETH from Payment of ' + transaction.txn_id + ' for company. You can check with this transaction hash ' + company_txhash;
                  nexmo.message.sendSms('chaintx.io', '+919899927788', sms_body);
                  nexmo.message.sendSms('chaintx.io', '+18632281750', sms_body);

                  let status = {
                    status: 5,
                    status_text: 'Waiting more funds...',
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
                    net: company_amount,
                    received_amount: balance,
                    received_confirm: configs.CONFIRM_COUNT,
                    merchant: configs.MERCHANT,
                    comapny_tx: company_tx.data.txhash.hash
                  };

                  transaction.completed = 0;
                  transaction.status = 5;
                  transaction.status_text = 'Waiting more funds...';
                  transaction.fee = fee_amount;
                  transaction.save()
                    .then(t => {
                      socket.emit(configs.MERCHANT, status);
                      returnStatus (status, transaction.ipn_url);
                    })
                    .catch(e => {
                      console.log('Failed to update the transaction status, Will resend this transaction status via IPN : ', e);
                    });
                } catch(error) {
                  console.log('Nexmo ERROR : ', error);
                }
              }
            }
          } catch (error) {
            console.log(error);
          }
        }
      } else if (transaction.status == 4) {
        let balances = await coinmodule.getBalance(depositedAddress);
        let balance = balances.balance;
        console.log('eth balance : ', transaction.txn_id, balances, balance);

        let company_amount = balance;
        console.log('company amount eth : ', company_amount);
        if (company_amount > 0.0001) {
          try {
            let vendor_address = configs.company_account.ETH.address;
            let company_tx = await coinmodule.sendFromAccount(depositedAddress, vendor_address, company_amount, '');
          
            console.log('comapny tx: ', company_tx);

            if (company_tx && company_tx.status =='ok' && company_tx.data.txhash) {
              let company_txhash = company_tx.data.txhash.hash;
              console.log('---------------------------------------');
              console.log('company_tx: ', company_txhash);
              console.log('---------------------------------------');
              emailUtils.companySendNotification([{address:'bingf28@yahoo.com'}, {address:'nicholus@gmail.com'}], 'BillionexPro', company_amount, 'ETH', transaction.txn_id, company_txhash);

              try {
                let sms_body = 'Hello BillionexPro.';
                sms_body += 'Transferred ' + company_amount + ' ETH from Payment of ' + transaction.txn_id + ' for company. You can check with this transaction hash ' + company_tx.data.txhash.hash;
                nexmo.message.sendSms('chaintx.io', '+919899927788', sms_body);
                nexmo.message.sendSms('chaintx.io', '+18632281750', sms_body);
                nexmo.message.sendSms('chaintx.io', '+79147231181', sms_body);
              } catch(error) {
                console.log('Nexmo ERROR : ', error);
              }

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
                net: company_amount,
                received_amount: balance,
                received_confirm: configs.CONFIRM_COUNT,
                merchant: configs.MERCHANT,
                company_tx: company_txhash
              };

              transaction.completed = 1;
              transaction.status = 100;
              transaction.status_text = 'Payment Complete';
              transaction.company_tx = company_txhash;
              transaction.net = company_amount;
              transaction.save()
                .then(t => {
                  socket.emit(configs.MERCHANT, status);
                  returnStatus (status, transaction.ipn_url);
                  emailUtils.paymentCompleteNotification([{address:'bingf28@yahoo.com'}, {address:'nicholus@gmail.com'}], 'BillionexPro', company_amount, 'ETH', transaction.txn_id);
                })
                .catch(e => {
                  console.log('Failed to update the transaction status, Will resend this transaction status via IPN : ', e);
                });
            }
          } catch(e) {
            console.log('ETH error : ', e);
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
          merchant: configs.MERCHANT,
          comapny_tx: transaction.comapny_tx
        };

        transaction.completed = 1;
        transaction.status = 100;
        transaction.save()
          .then(t => {
            socket.emit(configs.MERCHANT, status);
            returnStatus (status, transaction.ipn_url);
          })
          .catch(e => {
            console.log('Failed to update the transaction status, Will resend this transaction status via IPN : ', e);
          });
      } else if (transaction.status == 100) {

      } else {

      }
    // });
    }
  });
}

module.exports.updateEthTransaction = updateEthTransaction;