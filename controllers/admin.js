const rp = require('request-promise');

const ApiurlsModel = require('../models/apiurls');
const SmartcontractsModel = require('../models/smartcontracts');
const AdminConfigModel = require('../models/AdminConfigs');
const CoinpricesModel = require('../models/coinprice');

require('dotenv').config();
const configs = require('../config/configs').get(process.env.NODE_ENV);

exports.addApiUrl = function (req, res) {
  let apiurl = req.body.url;
  let symbol = req.body.symbol;
  let status = req.body.status;
  let type = req.body.type;

  if (!apiurl) {
    return res.status(200).json({success: 'fail', msg: 'Invalid url.'});
  }

  if (!symbol) {
    return res.status(200).json({success: 'fail', msg: 'Invalid coin symbol.'});
  }

  ApiurlsModel.find({symbol: symbol})
    .then(url => {
      console.log('url : ', url);
      if (!url || url.length == 0) {
        let u = new ApiurlsModel({
          symbol: symbol,
          url: apiurl,
          status: true,
          type: type,
        });

        u.save()
          .then(newUrl => {
            return res.status(200).json({status: 'ok', data: {
              symbol: symbol,
              url: apiurl,
              status: true,
            }});
          });
      } else {
        return res.status(200).json({status: 'fail', msg: 'Already registered.'});
      }
    })
    .catch(e => {
      return res.status(200).json({status: 'fail', msg: 'Please contact to administrator.'});
    });
}

exports.addAbi = function (req, res) {
  let abi = req.body.abi;
  let symbol = req.body.symbol;
  let type = req.body.type;
  let fullname = req.body.fullname;
  let decision = req.body.decision;
  let address = req.body.address;
  let parent_symbol = req.body.parent;

  SmartcontractsModel.findOne({symbol: symbol})
    .then(sm => {
      console.log('sm: ', sm);
      if (!sm) {
        sm = new SmartcontractsModel({
          abi: abi,
          symbol: symbol,
          type: type,
          fullname: fullname,
          decision: decision,
          address: address,
          parent: parent_symbol
        });
      } else {
        sm.abi = abi;
        sm.symbol = symbol;
        sm.type = type;
        sm.fullname = fullname;
        sm.decision = decision;
        sm.address = address;
        sm.parent = parent_symbol;
      }

      sm.save()
        .then(newSM => {
          return res.status(200).json({status: 'ok', data: sm});
        });
    })
    .catch(e => {
      return res.status(200).json({status: 'fail', msg: 'Please contact to administrator.'});
    });
}

exports.enableAbi = function (req, res) {
  let symbol = req.body.symbol;
  let enable = req.body.enable;
  let apiUrl = '';
  console.log('enable abi: ', req.body);

  SmartcontractsModel.findOne({symbol: symbol})
    .then(async sm => {
      if (sm) {
        console.log('parent : ', sm.parent);
        if (sm.parent == 'UBQ') {
          apiUrl = configs.node_api_url.UBQERC + "/api/v1/setting/addnewsmartcontract";
        } else {
          apiUrl = configs.node_api_url.ERC + "/api/v1/setting/addnewsmartcontract";
        }

        let options = {
          method: 'POST',
          uri: apiUrl,
          body: {
            abi: sm.abi,
            symbol: sm.symbol,
            type: sm.type,
            fullname: sm.fullname,
            decision: sm.decision,
            address: sm.address,
            status: enable
          },
          json: true
        }

        let ressult = await rp(options);
        console.log(ressult);

        return res.status(200).json({status: true, msg: 'Success to enable smartcontract!'});
      } else {
        return res.status(200).json({status: false, msg: 'Unregistered Token!'});
      }
    })
    .catch(e => {
      console.log(e);
      return res.status(200).json({status: false, msg: 'Failed to enable smartcontract!'});
    });
}

exports.addIpnUrl = function (req, res) {
  let merchant = req.body.merchant;
  let ipn_url = req.body.ipn_url;

  if (!merchant || !ipn_url || ipn_url == "") {
    res.status(200).json({status: false, msg: 'Invalid params.'});
  }

  AdminConfigModel.findOne({merchant: merchant, status: true})
    .then(adminConfig => {
      if (adminConfig) {
        adminConfig.ipn_url = ipn_url;
      } else {
        adminConfig = new AdminConfigModel({
          merchant: merchant,
          ipn_url: ipn_url
        });
      }

      adminConfig.save()
        .then(ac => {
          res.status(200).json({status: true, ipn_url: ipn_url, msg: 'Success to register ipn_url'});
        })
        .catch(e => {
          res.status(200).json({status: false, msg: 'Failed to register ipn_url.'});
        })
    })
    .catch(e => {
      console.log(e);
      res.status(200).json({status: false, msg: 'Failed to register ipn_url.'});
    });
}

exports.addMasterAddress = function (req, res) {
  let merchant = req.body.merchant;
  let address = req.body.address;
  let coin = req.body.coin;

  if (!merchant || !address || !coin) {
    res.status(200).json({status: false, msg: 'Invalid params.'});
  }

  AdminConfigModel.findOne({merchant: merchant, status: true})
    .then(adminConfig => {
      if (adminConfig) {
        adminConfig.addresses[coin] = address;
      } else {
        let addresses = {};
        addresses[coin] = address;
        adminConfig = new AdminConfigModel({
          merchant: merchant,
          addresses: addresses
        });
      }

      AdminConfigModel.update({merchant: merchant, status: true}, adminConfig, {upsert: true})
        .then(ac => {
          res.status(200).json({status: true, msg: 'Success to register address'});
        })
        .catch(e => {
          res.status(200).json({status: false, msg: 'Failed to register address.'});
        })
    })
    .catch(e => {
      console.log(e);
      res.status(200).json({status: false, msg: 'Failed to register address.'});
    });
}

exports.addInternalAddress = function (req, res) {
  let merchant = req.body.merchant;
  let address = req.body.address;
  let coin = req.body.coin;

  if (!merchant || !address || !coin) {
    res.status(200).json({status: false, msg: 'Invalid params.'});
  }

  AdminConfigModel.findOne({merchant: merchant, status: true})
    .then(adminConfig => {
      if (adminConfig) {
        adminConfig.masterAddress[coin] = address;
      } else {
        let masterAddress = {};
        masterAddress[coin] = address;
        adminConfig = new AdminConfigModel({
          merchant: merchant,
          masterAddress: masterAddress
        });
      }

      AdminConfigModel.update({merchant: merchant, status: true}, adminConfig, {upsert: true})
        .then(ac => {
          res.status(200).json({status: true, msg: 'Success to register internal address'});
        })
        .catch(e => {
          res.status(200).json({status: false, msg: 'Failed to register internal address.'});
        })
    })
    .catch(e => {
      console.log(e);
      res.status(200).json({status: false, msg: 'Failed to register internal address.'});
    });
}

exports.addDepositAccount = function (req, res) {
  let merchant = req.body.merchant;
  let account = req.body.account;

  if (!merchant || !account || account == "") {
    res.status(200).json({status: 'fail', msg: 'Invalid params.'});
  }

  AdminConfigModel.findOne({merchant: merchant, status: true})
    .then(adminConfig => {
      if (adminConfig) {
        adminConfig.depositAccount = account;
      } else {
        adminConfig = new AdminConfigModel({
          merchant: merchant,
          depositAccount: account
        });
      }

      adminConfig.save()
        .then(ac => {
          res.status(200).json({status: true, depositAccount: account, msg: 'Success to register depositAccount'});
        })
        .catch(e => {
          console.log(e);
          res.status(200).json({status: false, msg: 'Failed to register depositAccount.'});
        })
    })
    .catch(e => {
      console.log(e);
      res.status(200).json({status: false, msg: 'Failed to register depositAccount.'});
    });
}

exports.updateWbexPrice = function (req, res) {
  let merchant = req.body.merchant;
  let coin = req.body.coin;
  let price = req.body.price;

  if (!merchant || !price || price <= 0) {
    return res.status(200).json({status: false, msg: 'Invalid params.'});
  }

  if (coin !== 'UBQ' && coin !== 'WBTx' && coin !== 'WBT') {
    return res.status(200).json({status: false, msg: 'Invalid coin name.'});
  }

  CoinpricesModel.findOne({})
    .then(function (coinprice) {
      if (coinprice == null) {
        let cOption = {};
        cOption[coin] = price;

        coinprice = new CoinpricesModel(cOption);

        coinprice.save()
          .then(cp => {
            res.status(200).json({status: true, msg: 'Success to update ' + coin + ' price'});
          })
          .catch(e => {
            res.status(200).json({status: false, msg: 'Failed to update ' + coin + ' price'});
          });
      } else {
        coinprice[coin] = price;
        coinprice.save()
          .then(cp => {
            res.status(200).json({status: true, msg: 'Success to update ' + coin + ' price'});
          })
          .catch(e => {
            res.status(200).json({status: false, msg: 'Failed to update ' + coin + ' price'});
          });
      }
    });
}