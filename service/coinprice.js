const request = require('promise-request');
const schedule = require('node-schedule');

let CoinpricesModel = require('../models/coinprice');

require('dotenv').config();
let configs = require('../config/configs').get(process.env.NODE_ENV);

function updateCoinPrice (coin) {
  console.log('updating ' + coin + ' price');
  let coinbaseConfig = {
    scheme: 'https',
    host: 'api.coinbase.com',
    path: '/v2/prices/' + coin + '-USD/spot',
    method: 'GET'
  }

  request(coinbaseConfig).then(function(result) {
    let cPrice = result.data.data.amount;

    CoinpricesModel.findOne({})
      .then(function (coinprice) {
        if (coinprice == null) {
          let cOption = {};
          cOption[coin] = cPrice;

          coinprice = new CoinpricesModel(cOption);

          coinprice.save();
        } else {
          coinprice[coin] = cPrice;
          coinprice.save();
        }
      });
  }, function(error) {
    console.error(error);
    let cmcConfig = {
      scheme: 'https',
      host: 'api.coinmarketcap.com',
      path: 'v1/ticker/' + configs.COINFULLNAME[coin] + '/',
      method: 'GET'
    };

    request(cmcConfig).then(function(result) {
      let cPrice = result.data[0].price_usd;
      console.log('coinmarketcap price : ', cPrice);

      CoinpricesModel.findOne({})
        .then(function (coinprice) {
          if (coinprice == null) {
            let cOption = {};
            cOption[coin] = cPrice;

            coinprice = new CoinpricesModel(cOption);

            coinprice.save();
          } else {
            coinprice[coin] = cPrice;
            coinprice.save();
          }
        });
    }, function (error) {
      console.log(error);
    });
  });
}

function updateBixcPrice () {
  console.log('updating Bixc price');
  
  CoinpricesModel.findOne({})
    .then(function (coinprice) {
      if (coinprice == null) {
        let cOption = {};
        cOption['BIXC'] = configs.BIXC_PRICE;

        coinprice = new CoinpricesModel(cOption);

        coinprice.save();
      } else {
        coinprice['BIXC'] = configs.BIXC_PRICE;
        coinprice.save();
      }
    });
}

function updateZecPrice () {
  console.log('updating ZEC price');
  
  let cmcConfig = {
    scheme: 'https',
    host: 'api.coinmarketcap.com',
    path: '/v1/ticker/ZCASH/',
    method: 'GET'
  };

  request(cmcConfig).then(function(result) {
    let cPrice = result.data[0].price_usd;

    CoinpricesModel.findOne({})
      .then(function (coinprice) {
        if (coinprice == null) {
          let cOption = {};
          cOption['ZEC'] = cPrice;

          coinprice = new CoinpricesModel(cOption);

          coinprice.save();
        } else {
          coinprice.ZEC = cPrice;
          coinprice.save();
        }
      });
  }, function (error) {
    console.log(error);
  });
}

function updateBnbPrice () {
  console.log('updating BNB price');
  
  let cmcConfig = {
    scheme: 'https',
    host: 'api.coinmarketcap.com',
    path: '/v1/ticker/binance-coin/',
    method: 'GET'
  };

  request(cmcConfig).then(function(result) {
    let cPrice = result.data[0].price_usd;

    CoinpricesModel.findOne({})
      .then(function (coinprice) {
        if (coinprice == null) {
          let cOption = {};
          cOption['BNB'] = cPrice;

          coinprice = new CoinpricesModel(cOption);

          coinprice.save();
        } else {
          coinprice.BNB = cPrice;
          coinprice.save();
        }
      });
  }, function (error) {
    console.log(error);
  });
}

function updateUbqPrice () {
  console.log('updating UBQ price');
  
  let cmcConfig = {
    scheme: 'https',
    host: 'api.coinmarketcap.com',
    path: '/v1/ticker/ubiq/',
    method: 'GET'
  };

  request(cmcConfig).then(function(result) {
    let cPrice = result.data[0].price_usd;

    CoinpricesModel.findOne({})
      .then(function (coinprice) {
        if (coinprice == null) {
          let cOption = {};
          cOption['UBQ'] = cPrice;

          coinprice = new CoinpricesModel(cOption);

          coinprice.save();
        } else {
          coinprice.UBQ = cPrice;
          coinprice.save();
        }
      });
  }, function (error) {
    console.log(error);
  });
}

module.exports.updateCoinPrice = updateCoinPrice;
module.exports.updateBixcPrice = updateBixcPrice;
module.exports.updateZecPrice = updateZecPrice;
module.exports.updateBnbPrice = updateBnbPrice;
module.exports.updateUbqPrice = updateUbqPrice;