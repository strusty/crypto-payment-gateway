

var EthereumController = require('../controllers/ethereum');

module.exports = function (app) {
    //account related
    app.get('/api/get_address_balance/:address', EthereumController.getBalance);
    app.post('/api/create_account', EthereumController.createAccount);
    
    app.get('/api/getblocknumber', EthereumController.getBlockNumber);

    app.post('/api/sendfrom', EthereumController.transfer);
    app.post('/api/sendmany', EthereumController.sendfrom);
    app.post('/api/getnonce', EthereumController.getNonce);
    app.post('/api/checknode', EthereumController.checkNode);

    /************************ PK ENDPOINTS ***************************/
    app.post('/api/v1/create_account_pk', EthereumController.createAccountPK);
    app.post('/api/v1/sendfrompk', EthereumController.sendFromWithPK);
}