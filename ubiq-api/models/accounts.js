const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let AccountsSchema = new Schema({
	address: String,
	accountname: String,
	pk: String,
	updatedAt: {
		type: Date,
		default: Date.now
	}
});

let Accounts = mongoose.model('Accounts', AccountsSchema);
module.exports = Accounts;