const UbiqController = require('../controllers/ubiq');

module.exports = function (app) {
    //account related
    app.get('/api/get_address_balance/:address', UbiqController.getBalance);
    app.post('/api/create_account', UbiqController.createAccount);
    
    app.get('/api/getblocknumber', UbiqController.getBlockNumber);

    app.post('/api/sendfrom', UbiqController.transfer);
    app.post('/api/sendmany', UbiqController.sendfrom);

    /************************ PK ENDPOINTS ***************************/
    app.post('/api/v1/create_account_pk', UbiqController.createAccountPK);
    app.post('/api/v1/sendfrompk', UbiqController.sendFromWithPK);
}