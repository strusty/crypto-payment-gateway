import { Request, Response, Router } from 'express';

const Web3 = require('web3');

import * as ethUtils from 'ethereumjs-util';
import * as ethAbi from 'ethereumjs-abi';
import * as ethTx from 'ethereumjs-tx';
import * as fs from 'fs';
import * as CryptoJS from 'crypto-js';
import {BigNumber} from 'bignumber.js';

const moment = require('moment');

require('dotenv').config();
const config = require('../config/config').get(process.env.NODE_ENV);

import Smartcontracts from '../models/smartcontracts';
import Accounts from '../models/accounts';

const web3 = new Web3(new Web3.providers.HttpProvider(config.UBIQ_PROVIDER));

export class ErcRouter {

  public router: Router;

  constructor() {
    this.router = Router();
    this.routes();
  }

  private async sign (message: string, account: string, key: string) {
    let sig: string = '';
    sig = await web3.eth.accounts.sign(message, key);

    return sig;
  }

  public createNewAddress(req: Request, res: Response) {
    web3.eth.personal.newAccount(config.WALLET_PASSWORD, function (error, result) {
      if (!error) {
        res.status(200).json({address: result});
      } else {
        res.status(400).json({error: error});
      }
    });
  }

  public createNewAccount (req: Request, res: Response) {
    // Use Wb3 to get the balance of the address, convert it and then show it in the console.
    web3.eth.personal.newAccount(config.WALLET_PASSWORD, function (error, result) {
      if (!error) {
        res.status(200).json({address: result});
      } else {
        res.status(400).json({error: error});
      }
    });
  }

  private transferWithUnlock = (token:string, from:string, to:string, value:number, callback) => {
    Smartcontracts.findOne({symbol: token, status: true})
      .then((sm:any) => {
        let abi:any = JSON.parse(sm.abi);
        let address:string = sm.address;

        web3.eth.getBalance(from)
          .then((ethBalance:number) => {
            if (ethBalance > 0) {
              web3.eth.getGasPrice()
                .then((gasPrice: number) => {
                  if (gasPrice < 41000000000) {
                    gasPrice = 41000000000;
                  }

                  if (gasPrice * 250000 < ethBalance) {
                    web3.eth.getTransactionCount(from)
                      .then((nonce:number) => {
                        const ercContract = new web3.eth.Contract(abi, address);
                        web3.eth.personal.unlockAccount(from, config.WALLET_PASSWORD, function (error, result) {
                          if (error) {
                            callback({status: 'fail', msg: 'Failed to transfer ' + value + ' ' + token + ' tokens to address' + to}, null);
                          } else {
                            ercContract.methods.transfer(to, value * Math.pow(10, sm.decision)).send({from: from, gas: 160000, gasPrice: gasPrice, gasLimit: 250000, value: 0, chainId: 1}, function (error, txhash) {
                              if (error) {
                                callback({status: 'fail', msg: 'Failed to send transaction'}, null);
                              } else {
                                if (typeof txhash === 'undefined') {
                                  callback({status: 'fail', msg: 'insufficient funds for gas * price + value'}, null);
                                } else {
                                  callback(null, {status: 'ok', hash: txhash});
                                }
                              }
                            });
                          }
                        });
                      })
                      .catch((e:any) => {
                        callback({status: 'fail', msg: 'failed to get nonce'}, null);
                      });
                  } else {
                    callback({status: 'fail', msg: 'insufficient funds for gas * price + value'}, null);
                  }
                })
                .catch((e:any) => {
                  callback({status: 'fail', msg: 'failed to get gasPrice'}, null);
                });
            } else {
              callback({status: 'fail', msg: 'insufficient funds for gas * price + value'}, null);
            }
          })
          .catch((e:any) => {
            callback({status: 'fail', msg: 'failed to get eth balance of ' + from}, null);
          });
      })
      .catch((e:any) => {
        callback({status: 'fail', msg: 'insufficient funds for gas * price + value'}, null);
      });
  }

  private transferWithPK = (token:string, from:string, to:string, value:number, callback) => {
    Smartcontracts.findOne({symbol: token, status: true})
      .then((sm:any) => {
        if (!sm) {
          callback({status: 'fail', msg: 'Unregistered token.'}, null);
        }

        const abi:any = JSON.parse(sm.abi);
        const address:string = sm.address;
        value = value * Math.pow(10, sm.decision);

        web3.eth.getBalance(from)
          .then((ubqBalance:number) => {
            if (ubqBalance > 0) {
              web3.eth.getGasPrice()
                .then ((gasPrice: number) => {
                  gasPrice = 410000000000;

                  web3.eth.getTransactionCount(from)
                    .then((nonce: number) => {
                      const ercContract = new web3.eth.Contract(abi, address);
                      const contractData = ercContract.methods.transfer(to, value).encodeABI();

                      web3.eth.estimateGas({
                        from: from,
                        to: to,
                        data: contractData
                      }).then(function(gasEstimate) {
                        gasEstimate = 100000;

                        if (ubqBalance > gasPrice * gasEstimate) {
                          fs.readFile(config.SECRETPATH, {encoding: 'utf-8'}, function (err:any, data:string) {
                            if (err) {
                              callback({status: 'fail', msg: 'Your address is not in our system.'}, null);
                              return;
                            }

                            let pkBytes:any = CryptoJS.AES.decrypt(data.toString(), config.PKSECRET);
                            let cipherText:string = pkBytes.toString(CryptoJS.enc.Utf8);

                            Accounts.findOne({address: from})
                              .then((account:any) => {
                                let pkBytes:any = CryptoJS.AES.decrypt(account.pk, cipherText.toString());
                                let pk:string = pkBytes.toString(CryptoJS.enc.Utf8);
                                let privateKey = new Buffer(pk.replace('0x', ''), 'hex');

                                let rawTx = {
                                  nonce: '0x' + nonce.toString(16),
                                  gasPrice: '0x' + (Number(gasPrice) + 1000000000).toString(16),
                                  gasLimit: '0x' + Number(gasEstimate).toString(16),
                                  to: address,
                                  value: '0x00',
                                  data: contractData,
                                  chainId: 8
                                };

                                let tx = new ethTx(rawTx);
                                tx.sign(privateKey);

                                let serializedTx = tx.serialize();
                                web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'), (err:any, hash:string) => {
                                  if (err) {
                                    callback({status: 'fail', msg: 'Failed to send transaction.'}, null);
                                  } else {
                                    callback(null, {status: 'ok', hash: hash});
                                  }
                                })
                              })
                              .catch(e => {
                                callback({status: 'fail', msg: 'This address ' + from + ' don`t exit in our system.'}, null);
                              })
                          });
                        } else {
                          callback({status: 'fail', msg: 'insufficient funds for gas * price + value'}, null);
                        }
                      })
                      .catch((e:any) => {
                        callback({status: 'fail', msg: 'failed to get gasAmount.'}, null);
                      });
                    })
                    .catch((e:any) => {
                      callback({status: 'fail', msg: 'failed to get nonce.'}, null);
                    });
                })
                .catch((e:any) => {
                  callback({status: 'fail', msg: 'failed to get gas price.'}, null);
                });
            } else {
              callback({status: 'fail', msg: 'insufficient funds for gas * price + value'}, null);
            }
          })
          .catch((e:any) => {
            callback({status: 'fail', msg: 'failed to get eth balance as gas fee.'}, null);
          });
      })
      .catch((e:any) => {
        callback({status: 'fail', msg: 'failed to get abi'}, null);
      });
  }

  public transfer = async (req: Request, res: Response) => {
    const token: string = req.params.token;
    const from: string = req.body.from;
    const to: string = req.body.to;
    const value: number = req.body.value;

    if (!web3.utils.isAddress(to) || !web3.utils.isAddress(from)) {
      return res.status(200).json({status: 'fail', msg: 'invalid address'});
    }

    if (value <= 0) {
      return res.status(200).json({status: 'fail', msg: 'invalid amount'});
    }

    try {
      this.transferWithPK(token, from, to, value, (error:any, result:any) => {
        if (error) {
          return res.status(200).json(error);
        }

        return res.status(200).json(result);
      });
    } catch (e) {
      res.status(200).json({status: 'fail', msg: 'Failed to get account.'})
    }
  }

  public getBalance (req: Request, res: Response) {
    const userAddress: string = req.params.address;
    const token:string = req.params.token;

    if (userAddress.length < 40) {
      return res.status(200).json({status: 'fail', msg: 'invalid address'});
    }
    
    Smartcontracts.findOne({symbol: token, status: true})
      .then((sm:any) => {
        let abi:any = JSON.parse(sm.abi);
        let address:string = sm.address;

        const ercContract = new web3.eth.Contract(abi, address);
        ercContract.methods.balanceOf(userAddress).call()
          .then((balance:number) => {

            res.status(200).json({balance: Number(balance / Math.pow(10, sm.decision))});
          })
          .catch((e:any) => {
            res.status(200).json({status: 'fail', balance: 0});
          });
      })
      .catch((e:any) => {
        res.status(200).json({status: 'fail', balance: 0});
      });
  }

  public getEthBalance (req: Request, res: Response) {
    const userAddress: string = req.params.address;
    web3.eth.getBalance(userAddress, function (error, result) {
      if (!error) {
        var ethervalue: number = web3.utils.fromWei(result, 'ether');
        res.status(200).json({balance: ethervalue});
      }
      else {
        res.status(400).json({error: error});
      }
    });
  }

  public collectEth (req: Request, res: Response) {
    var from:string = req.body.from;
    var to:string = req.body.to;
    var value:number = req.body.value;

    // Use Wb3 to get the balance of the address, convert it and then show it in the console.
    web3.eth.getGasPrice().then((gasPrice:number) => {
      web3.eth.estimateGas({
        from: from,
        to: to
      })
      .then((gasEstimate:number) => {
        web3.eth.personal.unlockAccount(from, config.WALLET_PASSWORD, async function (error, result) {
          if (!error) {

            let calculated_value:number = web3.utils.toWei(value.toString());

            web3.eth.sendTransaction({
              from: from,
              to: to,
              value: calculated_value,
              gas: gasEstimate,
              gasPrice: gasPrice,
              // nonce: nonce
            }, function (err:any, hash:string) {
              if (!err) {
                res.status(200).json({hash: hash, gasprice: gasPrice, gaslimit: gasEstimate, value: value});
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
      });
    })
    .catch(e => {
      console.log(e);
    });
  }

  /******************************** FOR ICO *********************************/
  /**************************************************************************/

  public createNewAccountPK (req: Request, res: Response) {
    const accountname: string = req.body.accountname;

    fs.readFile(config.SECRETPATH, {encoding: 'utf-8'}, function (err, data) {
      if (err) {
        return res.status(400).json({status: 'fail', error: err});
      }

      let pkBytes:any = CryptoJS.AES.decrypt(data.toString(), config.PKSECRET);
      let cipherText:string = pkBytes.toString(CryptoJS.enc.Utf8);

      let result:any = web3.eth.accounts.create();
      let account:any = new Accounts({
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

  public transferPK (req: Request, res: Response) {
    const token: string = req.params.token;
    const from: string = req.body.from;
    const to: string = req.body.to;
    let value: number = req.body.value;

    if (value <= 0) {
      return res.status(200).json({status: 'fail', msg: 'invalid token amount'});
    }

    if (!web3.utils.isAddress(to)) {
      return res.status(200).json({status: 'fail', msg: 'invalid address'});
    }

    Smartcontracts.findOne({symbol: token, status: true})
      .then((sm:any) => {
        let abi:any = JSON.parse(sm.abi);
        let address:string = sm.address;
        value = value * Math.pow(10, sm.decision);

        web3.eth.getBalance(from)
          .then((ethBalance:number) => {
            if (ethBalance > 0) {
              web3.eth.getGasPrice()
                .then ((gasPrice: number) => {

                  web3.eth.getTransactionCount(from)
                    .then((nonce: number) => {
                      const ercContract = new web3.eth.Contract(abi, address);
                      const transfer_method = ercContract.methods.transfer(to, value);
                      const contractData = ercContract.methods.transfer(to, value).encodeABI();

                      web3.eth.estimateGas({
                        from: from,
                        to: to,
                        data: contractData
                      }).then(function(gasEstimate) {

                        if (ethBalance < gasPrice * gasEstimate) {
                          fs.readFile(config.SECRETPATH, {encoding: 'utf-8'}, function (err:any, data:string) {
                            if (err) {
                              return res.status(400).json({status: 'fail', error: err});
                            }

                            let pkBytes:any = CryptoJS.AES.decrypt(data.toString(), config.PKSECRET);
                            let cipherText:string = pkBytes.toString(CryptoJS.enc.Utf8);

                            Accounts.findOne({address: from})
                              .then((account:any) => {
                                let pkBytes:any = CryptoJS.AES.decrypt(account.pk, cipherText.toString());
                                let pk:string = pkBytes.toString(CryptoJS.enc.Utf8);
                                let privateKey = new Buffer(pk.replace('0x', ''), 'hex');

                                let rawTx = {
                                  nonce: nonce,
                                  gasPrice: gasPrice,
                                  gasLimit: gasEstimate,
                                  to: address,
                                  value: 0,
                                  data: contractData
                                };

                                let tx = new ethTx(rawTx);
                                tx.sign(privateKey);

                                let serializedTx = tx.serialize();
                                web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'), (err:any, hash:string) => {
                                  if (err) {
                                    return res.status(200).json({status: 'fail', msg: 'Failed to send transaction.'});
                                  }

                                  res.status(200).json({status: 'ok', hash: hash});
                                })
                              })
                              .catch(e => {
                                return res.status(200).json({status: 'fail', msg: 'This address ' + from + ' don`t exit in our system.'});
                              })
                          });
                        } else {
                          res.status(200).json({status: 'fail', msg: 'insufficient funds for gas * price + value'});
                        }
                      })
                      .catch((e:any) => {
                        res.status(200).json({status: 'fail', msg: 'failed to get gasAmount.'});
                      });
                    })
                    .catch((e:any) => {
                      res.status(200).json({status: 'fail', msg: 'failed to get nonce.'});
                    });
                })
                .catch((e:any) => {
                  res.status(200).json({status: 'fail', msg: 'failed to get gas price.'});
                });
            } else {
              res.status(200).json({status: 'fail', msg: 'insufficient funds for gas * price + value'});
            }
          })
          .catch((e:any) => {
            res.status(200).json({status: 'fail', msg: 'failed to get eth balance as gas fee.'});
          });
      })
      .catch((e:any) => {
        res.status(200).json({status: 'fail', msg: 'failed to get abi'});
      });
  }

  public routes() {
    this.router.post('/createaddress', this.createNewAddress);
    this.router.post('/createaccount', this.createNewAccount);
    this.router.post('/transfer/:token', this.transfer);
    this.router.post('/collect', this.collectEth);
    this.router.get('/getbalance/:token/:address', this.getBalance);
    this.router.get('/getethbalance/:address', this.getEthBalance);

    this.router.post('/createaccountpk', this.createNewAccountPK);
    this.router.post('/transferpk/:token', this.transferPK);
  }

}

const ercRoutes = new ErcRouter();
ercRoutes.routes();

export default ercRoutes.router;