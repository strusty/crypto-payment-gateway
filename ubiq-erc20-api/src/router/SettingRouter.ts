import { Request, Response, Router } from 'express';
import Smartcontracts from '../models/smartcontracts';

const moment = require('moment');

require('dotenv').config();
const config = require('../config/config').get(process.env.NODE_ENV);

export class SettingRouter {

  public router: Router;

  constructor() {
    this.router = Router();
    this.routes();
  }

  public addNewSmartContract(req: Request, res: Response) {
    let symbol:string = req.body.symbol;
    let abi:any = req.body.abi;
    let type:string = req.body.type;
    let fullname:string = req.body.fullname;
    let decision:number = req.body.decision;
    let address:string = req.body.address;
    let status:string = req.body.status;
    console.log(req.body);

    Smartcontracts.findOne({symbol: symbol})
      .then((sm:any) => {
        if (!sm) {
          sm = new Smartcontracts({
            abi: abi,
            symbol: symbol,
            type: type,
            fullname: fullname,
            decision: decision,
            address: address,
            status: status
          });
        } else {
          sm.abi = abi;
          sm.symbol = symbol;
          sm.type = type;
          sm.fullname = fullname;
          sm.decision = decision;
          sm.address = address;
          sm.status = status;
        }

        sm.save()
          .then((newSm:any) => {
            console.log('Success to save new smartcontract!');
            res.status(200).json({status:'ok', data: sm});
          })
          .catch((e:any) => {
            res.status(200).json({status:'fail', msg: 'Failed to save smartcontract'});
          });
      })
      .catch((e:any) => {
        console.log('Failed to find smartcontract : ', e)
        res.status(200).json({status:'fail', msg: 'Failed to find smartcontract'});
      });
  }

  public routes() {
    this.router.post('/addnewsmartcontract', this.addNewSmartContract);
  }

}

const settingRoutes = new SettingRouter();
settingRoutes.routes();

export default settingRoutes.router;