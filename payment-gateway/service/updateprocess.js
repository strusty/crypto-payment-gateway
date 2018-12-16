const schedule = require('node-schedule');

const btcExchange = require('./btcexchange');
const ethExchange = require('./ethexchange');
const ubqExchange = require('./ubqexchange');

const coinPrice = require('./coinprice');

exports.startUpdateService = function (io, merchant) {
  console.log("Update service");

  schedule.scheduleJob('1 */5 * * * *', function () {
    console.log('BTC price update');
    coinPrice.updateCoinPrice('BTC');
  });

  schedule.scheduleJob('10 */5 * * * *', function () {
    console.log('ETH price update');
    coinPrice.updateCoinPrice('ETH');
  });

  schedule.scheduleJob('20 */5 * * * *', function () {
    console.log('UBQ price update');
    coinPrice.updateUbqPrice();
  });

  const btcJobForExchange = schedule.scheduleJob('*/2 * * * *', function () {
    console.log('btcExchange');
    btcExchange.updateBtcExchange();
  });

  const ethJobForExchange = schedule.scheduleJob('*/2 * * * *', function () {
    console.log('ethExchange');
    ethExchange.updateEthExchange();
  });

  const ubqJobForExchange = schedule.scheduleJob('*/2 * * * *', function () {
    console.log('ubqExchange');
    ubqExchange.updateUbqExchange();
  });
}
