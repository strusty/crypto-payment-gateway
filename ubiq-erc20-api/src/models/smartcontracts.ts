import { model, Schema } from 'mongoose';

// create a schema
const SmartcontractsSchema: Schema = new Schema({
  symbol: String,
  fullname: String,
  type: {
    type: String,
    default: 'ERC20'
  },
  status: {
    type: Boolean,
    default: true
  },
  abi: String,
  decision: Number,
  address: String,

  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default model('Smartcontracts', SmartcontractsSchema);