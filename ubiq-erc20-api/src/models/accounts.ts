import { model, Schema } from 'mongoose';

// create a schema
const AccountsSchema: Schema = new Schema({
  address: String,
  accountname: String,
  pk: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default model('Accounts', AccountsSchema);