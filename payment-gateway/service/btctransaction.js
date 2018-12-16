const curl = require('curlrequest');
const moment = require('moment');
const Nexmo = require('nexmo');

// const io = require('socket.io')(server);

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
      console.log('curl err : ', err);
      console.log('curl data : ', data);
    });
  } catch (e) {
    console.log('IPN ERROR : ', e);
  }
}

function updateBtcTransaction(socket) {
  TransactionsModel.find({completed: 0, currency2: 'BTC', transaction_type: {$ne: 'ico'}}).then(async function (transactions) {
    for (let i = 0; i < transactions.length; i++) {
    // transactions.forEach(async function (transaction) {
      let transaction = transactions[i];
      let depositedAddress = transaction.depositAddress;
      let depositedAccount = transaction.depositAccount;
      let depositedCurrency = transaction.currency2;

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
              merchant: configs.MERCHANT,
            };

            transaction.completed = -1;
            transaction.status = -1;
            transaction.status_text = 'Cancelled / Timed Out';
            await transaction.save();

            socket.emit(configs.MERCHANT, status);
            returnStatus (status, transaction.ipn_url);

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
                merchant: configs.MERCHANT,
              };

              transaction.status = 1;
              transaction.status_text = 'We have confirmed coin reception from the buyer';
              await transaction.save();
              socket.emit(configs.MERCHANT, status);
              returnStatus (status, transaction.ipn_url);
            }
          }
        } else if (transaction.status == 1) {
          let balance = await coinmodule.getReceivedByAddress(depositedAddress, configs.CONFIRM_COUNT);

          if (balance > 0) {
            let need_more_amount = parseFloat(transaction.wanted_coin_amount - balance).toFixed(8) * 1.0;

            if (need_more_amount > 0.0006) {
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
                received_amount: balance,
                received_confirm: configs.CONFIRM_COUNT,
                merchant: configs.MERCHANT,
                need_more_amount: need_more_amount,
              };

              transaction.status = 3;
              transaction.status_text = 'Waiting for buyers funds..., (' + balance + '/' + transaction.wanted_coin_amount + ' received with ' + configs.CONFIRM_COUNT + ' confirms)';
              transaction.amount2 = balance;
              transaction.need_more_amount = need_more_amount;

              await transaction.save()
                
              socket.emit(configs.MERCHANT, status);
              returnStatus (status, transaction.ipn_url);
                
            } else {
              let fee_amount = parseFloat(balance * configs.SYSTEM_FEE).toFixed(8) * 1.0;
              console.log('fee_amount : ', fee_amount, balance, transaction.txn_id, transaction.depositAddress);

              if (transaction.commission_status != 1) {
                let tx = await coinmodule.sendFromAccount(configs.company_account.BTC.account, configs.commission_account.BTC.address, fee_amount, configs.CONFIRM_COUNT);
                // let tx = await coinmodule.sendToAddress(configs.commission_account.BTC.address, fee_amount);
                console.log('fee tx: ', tx);

                if (tx && tx.status =='ok' && tx.data.txhash) {
                  let calculated_balance = parseFloat(balance - fee_amount - configs.BTC_TRANSACTION_FEE * 1.0).toFixed(8) * 1.0;

                  let status = {
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
                    merchant: configs.MERCHANT,
                    fee_tx: tx.data.txhash
                  };

                  transaction.status = 4;
                  transaction.status_text = 'Funds received and confirmed, sending to you shortly...';
                  transaction.fee_tx = tx.data.txhash ? tx.data.txhash : '';
                  transaction.net = calculated_balance;
                  transaction.need_more_amount = 0;
                  transaction.commission_status = 1;
                  transaction.amount2 = balance;
                  transaction.fee_amount = fee_amount;

                  await transaction.save();
                    
                  socket.emit(configs.MERCHANT, status);
                  returnStatus (status, transaction.ipn_url);  
                }
              }
            }
          }
        } else if (transaction.status == 3) {
          let balance = await coinmodule.getReceivedByAddress(depositedAddress, configs.CONFIRM_COUNT);
          let need_more_amount = parseFloat(transaction.wanted_coin_amount - balance).toFixed(8) * 1.0;

          if (need_more_amount < 0.0001) {
            let fee_amount = parseFloat(balance * configs.SYSTEM_FEE).toFixed(8) * 1.0;
            console.log('fee_amount:', fee_amount, balance, transaction.txn_id, transaction.depositAddress);

            if (transaction.commission_status != 1) {
              let vendor_address = transaction.address || configs.company_account.BTC.address;
              let tx = await coinmodule.sendFromAccount(configs.company_account.BTC.account, vendor_address, fee_amount, configs.CONFIRM_COUNT);
              // let tx = await coinmodule.sendToAddress(configs.commission_account.BTC.address, fee_amount);
              console.log('fee tx: ', tx);

              if (tx && tx.status =='ok' && tx.data.txhash) {
                let calculated_balance = parseFloat(balance - fee_amount - configs.BTC_TRANSACTION_FEE * 1.0).toFixed(8) * 1.0;

                let status = {
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
                  merchant: configs.MERCHANT,
                  fee_tx: tx.data.txhash
                };

                transaction.status = 4;
                transaction.status_text = 'Funds received and confirmed, sending to you shortly...';
                transaction.fee_tx = tx.data.txhash ? tx.data.txhash : '';
                transaction.net = calculated_balance;
                transaction.need_more_amount = 0;
                transaction.commission_status = 1;
                transaction.amount2 = balance;
                transaction.fee_amount = fee_amount;

                await transaction.save();
                
                socket.emit(configs.MERCHANT, status);
                returnStatus (status, transaction.ipn_url);
              }
            }
          }
        } else if (transaction.status == 4) {
          if (!transaction.company_tx || transaction.company_tx == '') {
            let company_amount = parseFloat(transaction.net - configs.BTC_TRANSACTION_FEE * 1.0).toFixed(8) * 1.0;
            let vendor_address = transaction.address || configs.company_account.BTC.address;
            console.log('comapny transfer : ', configs.company_account.BTC.account, vendor_address, company_amount, configs.BTC_TRANSACTION_FEE);

            if (transaction.company_status < 1) {
              transaction.company_status = 1;
              await transaction.save();

              try {
                let company_tx = await coinmodule.sendFromAccount(configs.company_account.BTC.account, vendor_address, company_amount, configs.CONFIRM_COUNT);
                // let company_tx = await coinmodule.sendToAddress(configs.company_account.BTC.address, company_amount);

                let company_txhash = '';

                if (company_tx && company_tx.data && company_tx.data.txhash) {
                  company_txhash = company_tx.data.txhash;

                  console.log('---------------------------------------');
                  console.log('company_tx: ', company_txhash);
                  console.log('---------------------------------------');

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
                    received_amount: company_amount,
                    net: company_amount,
                    received_confirm: 2,
                    merchant: configs.MERCHANT,
                    fee_tx: transaction.fee_tx,
                    company_tx: company_txhash
                  };

                  transaction.completed = 0;
                  transaction.status = 99;
                  transaction.status_text = 'Payment Complete';
                  transaction.company_status = 2;
                  transaction.company_tx = company_txhash;
                  transaction.net = company_amount;

                  await transaction.save();
                    
                  console.log('status completed : ', transaction.txn_id);
                  socket.emit(configs.MERCHANT, status);
                  returnStatus (status, transaction.ipn_url);
                
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
              received_amount: transaction.received_amount,
              net: transaction.net,
              received_confirm: 2,
              merchant: configs.MERCHANT,
              fee_tx: transaction.fee_tx,
              company_tx: transaction.company_tx
            };

            transaction.completed = 1;
            transaction.status = 100;
            
            await transaction.save()
              
            console.log('status completed : ', transaction.txn_id);
            socket.emit(configs.MERCHANT, status);
            returnStatus (status, transaction.ipn_url);
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
            merchant: configs.MERCHANT,
            fee_tx: transaction.fee_tx,
            company_tx: transaction.company_tx
          };

          transaction.completed = 1;
          transaction.status = 100;

          await transaction.save();

          socket.emit(configs.MERCHANT, status);
          returnStatus (status, transaction.ipn_url);
        } else if (transaction.status == 100) {

        }
      } catch (error) {
        console.log(error);
      }
    }
    // });
  });
}

module.exports.updateBtcTransaction = updateBtcTransaction;