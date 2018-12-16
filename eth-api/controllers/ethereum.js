const Web3 = require('web3');
const mongoose = require('mongoose');
const CryptoJS = require('crypto-js');
const Tx = require('ethereumjs-tx');
const fs = require('fs');
const path = require('path');
const sleep = require('sleep');
const BigNumber = require('bignumber.js');

// Show Web3 where it needs to look for a connection to Ethereum.
const config = require('../config/common').info;

const web3 = new Web3(new Web3.providers.HttpProvider(config.provider));

const Accounts = require('../models/accounts');
// var web3 = new Web3(new Web3.providers.HttpProvider('https://api.myetherapi.com/eth'));

function transferWithPK (from, to, value, pk, gasEnable, callback) {
  web3.eth.getBalance(from, function (err, balance) {
    if (err) {
      callback({status: 'fail', msg: 'web3 error!!!'}, null);
    }

    if (!web3.utils.isAddress(to) || !web3.utils.isAddress(from)) {
      callback({status: 'fail', msg: 'invalid address'}, null);
    }

    // Use Wb3 to get the balance of the address, convert it and then show it in the console.
    web3.eth.getGasPrice().then(function(gasPrice) {
      web3.eth.estimateGas({
        from: from,
        to: to
      })
      .then(gasEstimate => {
        if (gasPrice < 10000000000) {
          gasPrice = gasPrice * 4;
        }

        balance = new BigNumber(web3.utils.fromWei(balance, 'ether'));
        value = new BigNumber(value);

        if (Number(balance.minus(value)) >= 0) {
          web3.eth.getTransactionCount(from).then(function(nonce) {
            let calculated_value = 0;

            if (gasEnable) {
              calculated_value = web3.utils.toWei(value.minus(gasPrice * gasEstimate / 1e18).toString());
            } else {
              calculated_value = web3.utils.toWei(value.toString());
            }
            
            if (Number(calculated_value) < 0) {
              callback({status: 'fail', msg: 'insufficient funds for gas * price + value'}, null);
            }

            fs.readFile(config.secretpath, {encoding: 'utf-8'}, function (err, data) {
              if (err) {
                callback({status: 'fail', msg: 'failed to get encrypt key'}, null);
                return;
              }

              let pkBytes = CryptoJS.AES.decrypt(data.toString(), config.pksecret);
              let cipherText = pkBytes.toString(CryptoJS.enc.Utf8);

              pkBytes = CryptoJS.AES.decrypt(pk, cipherText.toString());
              pk = pkBytes.toString(CryptoJS.enc.Utf8);
              let privateKey = new Buffer(pk.replace('0x', ''), 'hex');

              let rawTx = {
                nonce: nonce,
                gasPrice: parseFloat(gasPrice),
                gasLimit: parseFloat(gasEstimate),
                to: to,
                value: calculated_value
              };

              let tx = new Tx(rawTx);
              tx.sign(privateKey);

              console.log('Total Amount of wei needed: ' + tx.getUpfrontCost().toString());

              let serializedTx = tx.serialize();
              web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'), function (err, hash) {
                if (err) {
                  callback({status: 'fail', msg: 'Failed to send transaction.'}, null);
                }

                callback(null, {status: 'ok', hash: hash});
              });
            });
          })
          .catch(e => {
            callback({status: 'fail', msg: 'Failed to get nonce'}, null);
          });
        } else {
          callback({status: 'fail', msg: 'insufficient funds for gas * price + value'}, null);
        }
      })
      .catch(e => {
        callback({status: 'fail', msg: 'Failed to get gasEstimate'}, null);
      })
    })
    .catch(e => {
      callback({status: 'fail', msg: 'Failed to get gasPrice'}, null);
    });
  });
}

function transferWithUnlock (from, to, value, callback) {
  if (!web3.utils.isAddress(to) || !web3.utils.isAddress(from)) {
    return res.status(200).json({status: 'fail', msg: 'invalid address'});
  }

  web3.eth.getBalance(from, function (err, balance) {
    web3.eth.getGasPrice().then(function(gasPrice) {
      web3.eth.estimateGas({
        from: from,
        to: to
      })
      .then(gasEstimate => {
        balance = new BigNumber(web3.utils.fromWei(balance, 'ether'));
        value = new BigNumber(value);
        
        if (Number(balance.minus(value)) >= 0) {
          web3.eth.personal.unlockAccount(from, config.mainpass, async function (error, result) {
            if (!error) {
              let calculated_value = web3.utils.toWei(value.minus(gasPrice * gasEstimate / 1e18).toString());
              if (Number(calculated_value) < 0) {
                callback({status: 'fail', msg: 'insufficient funds for gas * price + value'}, null);
                return;
              }

              web3.eth.sendTransaction({
                from: from,
                to: to,
                value: calculated_value,
                gas: gasEstimate,
                gasPrice: gasPrice,
                // nonce: nonce
              }, function (err, hash) {
                if (!err) {
                  callback(null, {status: 'ok', hash: hash});
                }
                else {
                  callback({status: 'fail', msg: 'Failed to send this transaction'}, null);
                }
              })
            }
            else {
              callback({status: 'fail', msg: 'This address ' + from + ' don`t exist in our system'}, null);
            }
          });
        } else {
          callback({status: 'fail', msg: 'insufficient funds for gas * price + value'}, null);
        }
      });
    })
    .catch(e => {
      callback({status: 'fail', msg: 'Failed to get gasPrice'}, null);
    });
  })
  .catch(e => {
    callback({status: 'fail', msg: 'Failed to get balance of ' + from}, null);
  });
}

exports.getBlockNumber = function(req, res) {
  web3.eth.getBlockNumber(function (error, result) {
    res.status(200).json({result: result});
  });
}

exports.getBalance = function(req, res) {
  var addr = req.params.address;

  if (addr.length < 40) {
    return res.status(200).json({status: 'fail', msg: 'invalid address : ' + addr});
  }

  // Use Wb3 to get the balance of the address, convert it and then show it in the console.
  web3.eth.getBalance(addr, function (error, result) {
    if (!error) {
      var ethervalue = web3.utils.fromWei(result, 'ether');
      res.status(200).json({balance: ethervalue});
    }
    else {
      res.status(400).json({error: error});
    }
  });
}

exports.createAccount = function(req, res) {
  // Use Wb3 to get the balance of the address, convert it and then show it in the console.
  web3.eth.personal.newAccount(config.mainpass, function (error, result) {
    if (!error) {
      res.status(200).json({address: result});
    }
    else {
      res.status(400).json({error: error});
    }
  });
}

//to enable calls of personal functions, need to set --rpcapi eth,web3,personal when call geth
exports.sendfrom = function(req, res) {
  console.log("sendfrom", req.body);
  var from = req.body.from;
  var to = req.body.to;
  var value = req.body.value;
  var gasPrice = 0;
  var gasEstimate = 21000;

  // Use Wb3 to get the balance of the address, convert it and then show it in the console.
  
  web3.eth.personal.unlockAccount(from, config.mainpass, async function (error, result) {
    if (!error) {
      let calculated_value = web3.utils.toWei(value.toString()) - (gasPrice * gasEstimate);
      if (calculated_value < 0) {
        calculated_value = web3.utils.toWei(value.toString());
      }

      web3.eth.sendTransaction({
        from: from,
        to: to,
        value: calculated_value,
        // gas: gasEstimate,
        // gasPrice: gasPrice,
        // nonce: nonce
      }, function (err, hash) {
        if (!err) {
          res.status(200).json({hash: hash});
        }
        else {
          res.status(400).json({error: err});
        }
      })
    }
    else {
      res.status(400).json({error: error});
    }
  });
}

exports.transfer = function (req, res) {
  var from = req.body.from.trim('\t');
  var to = req.body.to.trim('\t');
  var value = req.body.value;
  var gasEnable = req.body.fee || true;

  Accounts.findOne({address: from})
    .then(account => {
      if (!account) {
        return res.status(200).json({status: 'fail', msg: 'Don`t exist in our system.'});
      } else {
        transferWithPK(from, to, value, account.pk, gasEnable, function (err, result) {
          if (err) {
            return res.status(200).json(err);
          }

          return res.status(200).json(result);
        });
      }
    })
    .catch(err => {
      return res.status(200).json({status: 'fail', msg: 'Database error!'});
    });
}

//to enable calls of personal functions, need to set --rpcapi eth,web3,personal when call geth
exports.makeTransaction = async function(req, res) {
  console.log("makeTransaction", req.body);
  var from = req.body.from.trim('\t');
  var to = req.body.to.trim('\t');
  var value = req.body.value;
  var nonce = req.body.nonce;

  var balance = await web3.eth.getBalance(from);

  if (to.length < 40) {
    return res.status(200).json({status: 'fail', msg: 'invalid address : ' + to});
  }

  if (!web3.utils.isAddress(to) || !web3.utils.isAddress(from)) {
    return res.status(200).json({status: 'fail', msg: 'invalid address'});
  }

  // Use Wb3 to get the balance of the address, convert it and then show it in the console.
  web3.eth.getGasPrice().then(function(gasPrice) {
    web3.eth.estimateGas({
      from: from,
      to: to
    })
    .then(gasEstimate => {
      if (balance >= Number(web3.utils.toWei(value.toString()))) {
        web3.eth.personal.unlockAccount(from, config.mainpass, async function (error, result) {
          if (!error) {
            if (!nonce) {
              nonce = await web3.eth.getTransactionCount(from, "pending") + 1;
            }

            let calculated_value = web3.utils.toWei(value.toString()) - (gasPrice * gasEstimate)
            if (calculated_value < 0) {
              calculated_value = web3.utils.toWei(value.toString());
            }

            web3.eth.sendTransaction({
              from: from,
              to: to,
              value: calculated_value,
              gas: gasEstimate,
              gasPrice: gasPrice,
              // nonce: nonce
            }, function (err, hash) {
              if (!err) {
                res.status(200).json({hash: hash});
              }
              else {
                res.status(400).json({error: err});
              }
            })
          }
          else {
            res.status(400).json({error: error});
          }
        });
      } else {
        return res.status(200).json({status: 'fail', msg: 'insufficient funds for gas * price + value'});
      }
    });
  })
  .catch(e => {
    console.log(e);
  })
}

exports.getNonce = async function (req, res) {
  let address = req.body.address;

  let nonce = await web3.eth.getTransactionCount(address, "pending") + 1;

  res.status(200).json({nonce: nonce});
}

exports.checkNode = function (req, res) {
  let addresses = req.body.addresses;
  for (let i = 0; i < addresses.length; i++) {
    let address = addresses[i];

    web3.eth.personal.unlockAccount(address, config.mainpass, function (error, result) {
      if (!error) {
        console.log('Unlocked Account: ', address);
        
      } else {
        console.log(address, ' : ', error);
      }
    });

    sleep.sleep(2);
  }

  res.status(200).json({success: 'ok', msg: 'this address is in our node'});
}

exports.getBalanceFromAddress = async function (req, res) {
  let userAddress = req.body.user;
  let tokenAddresses = req.body.tokens;
  let balances = [], tokenBalance, balance;

  try {
    for (var i = 0; i < tokenAddresses.length; i++) {
      tokenAddress = tokenAddresses[i];
      balance = {};

      if (tokenAddress == '0x0000000000000000000000000000000000000000') {
        tokenBalance = await web3.eth.getBalance(userAddress);
      } else {
        if (userAddress.slice(0, 2) == "0x") {
          userAddress = userAddress.substring(2)
        }

        let contractData = ('0x70a08231000000000000000000000000' + userAddress);
        tokenBalance = await web3.eth.call({to: tokenAddress, data: contractData });
      }

      balance[tokenAddress] = tokenBalance;
      balances.push(balance);
    }
  } catch (error) {
    console.log(error);
  }

  res.status(200).json({success: 'ok', data: balances});
}

/********************************* PK Function **********************************/
exports.createAccountPK = function(req, res) {
  let accountname = req.body.accountname;
  console.log("createAccount with PK : ", accountname);

  // Use Web3 to get the balance of the address, convert it and then show it in the console.
  fs.readFile(config.secretpath, {encoding: 'utf-8'}, function (err, data) {
    if (err) {
      return res.status(400).json({status: 'fail', error: err});
    }

    let pkBytes = CryptoJS.AES.decrypt(data.toString(), config.pksecret);
    let cipherText = pkBytes.toString(CryptoJS.enc.Utf8);

    let result = web3.eth.accounts.create();
    let account = new Accounts({
      address: result.address,
      accountname: accountname,
      pk: CryptoJS.AES.encrypt(result.privateKey.toString(), cipherText.toString()).toString()
    });
    account.save().then(acc => {
      res.status(200).json({status: 'ok', data: {address: result.address, accountname: accountname}});
    }).catch(e => {
      res.status(200).json({status: 'fail', error: e});
    });
  });
}

exports.sendFromWithPK = function(req, res) {
  var from = req.body.from.trim('\t');
  var to = req.body.to.trim('\t');
  var value = req.body.value;
  var feeEnable = req.body.fee;

  web3.eth.getBalance(from, function (err, balance) {
    if (err) {
      res.status(200).json({status: 'fail', msg: 'web3 error!!!'});
    }

    if (!web3.utils.isAddress(to) || !web3.utils.isAddress(from)) {
      return res.status(200).json({status: 'fail', msg: 'invalid address'});
    }

    // Use Wb3 to get the balance of the address, convert it and then show it in the console.
    web3.eth.getGasPrice().then(function(gasPrice) {
      console.log('gas Price: ', gasPrice);
      web3.eth.estimateGas({
        from: from,
        to: to
      })
      .then(gasEstimate => {
        if (balance >= Number(web3.utils.toWei(value.toString()))) {
          web3.eth.getTransactionCount(from).then(function(nonce) {
            let calculated_value = 0;
            if (feeEnable) {
              calculated_value = web3.utils.toWei(value.toString()) - (gasPrice * gasEstimate);
            } else {
              calculated_value = web3.utils.toWei(value.toString());
            }
            if (calculated_value < 0) {
              calculated_value = web3.utils.toWei(value.toString());
            }

            fs.readFile(config.secretpath, {encoding: 'utf-8'}, function (err, data) {
              if (err) {
                return res.status(400).json({status: 'fail', error: err});
              }

              let pkBytes = CryptoJS.AES.decrypt(data.toString(), config.pksecret);
              let cipherText = pkBytes.toString(CryptoJS.enc.Utf8);

              Accounts.findOne({address: from})
                .then(account => {
                  if (!account) {
                    return res.status(200).json({status: 'fail', msg: 'Failed to get account'});
                  }

                  pkBytes = CryptoJS.AES.decrypt(account.pk, cipherText.toString());
                  let pk = pkBytes.toString(CryptoJS.enc.Utf8);
                  let privateKey = new Buffer(pk.replace('0x', ''), 'hex');

                  let rawTx = {
                    nonce: nonce,
                    gasPrice: parseFloat(gasPrice),
                    gasLimit: parseFloat(gasEstimate),
                    to: to,
                    value: Number(calculated_value)
                  };

                  let tx = new Tx(rawTx);
                  tx.sign(privateKey);

                  let serializedTx = tx.serialize();
                  web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'), function (err, hash) {
                    if (err) {
                      return res.status(200).json({status: 'fail', msg: 'Failed to send transaction.'});
                    }

                    res.status(200).json({status: 'ok', hash: hash});
                  });
                })
                .catch(e => {
                  return res.status(200).json({status: 'fail', msg: 'This address ' + from + ' don`t exit in our system.'});
                })
            });
          })
          .catch(e => {
            return res.status(200).json({status: 'fail', msg: 'Failed to get nonce'});
          });
        } else {
          return res.status(200).json({status: 'fail', msg: 'insufficient funds for gas * price + value'});
        }
      })
      .catch(e => {
        return res.status(200).json({status: 'fail', msg: 'Failed to get gasEstimate'});
      })
    })
    .catch(e => {
      return res.status(200).json({status: 'fail', msg: 'Failed to get gasPrice'});
    });
  });
}