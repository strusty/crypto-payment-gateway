const crypto = require('crypto');
const jwt_decode = require('jwt-decode');
const jwt = require('jsonwebtoken');

const ApiKeysModel = require('../models/apiKeys');

var WhitelistModel = require('../models/whitelist');

const config = require('../config/configs').get(process.env.NODE_ENV);

exports.jwtVerify = async function (payload, signature, body) {

  console.log('payload', payload);
  
  if (payload == null || payload == '') {
    return {success: false, error: {type: 'jwt InvalidTokenError', msg: 'Invalid token specified'}};
  }

  let decoded = jwt_decode(payload);
  console.log('decoded: ', decoded);
  let apikey = decoded.key;
  let iss = decoded.iss;
  let exp = decoded.exp;
  console.log(JSON.stringify(body));

  let keydata = await ApiKeysModel.findOne({key: apikey});

  if (decoded.iss != keydata.issuer) {
    return {success: false, error: {type: 'jwt InvalidISSError', msg: 'Invalid token ISS'}};
  }

  const hmac = crypto.createHmac('sha256', keydata.secret);
  hmac.update(JSON.stringify(body));
  let signed = hmac.digest('hex');
  console.log('signed: ', signed, signature);

  if (signature != signed) {
    return {success: false, error: {type: 'Signature', msg: 'Invalid data signature'}};
  }

  // if (exp * 1000 < Date.now()) {
  //  return {success: false, error: {type: 'jwt TokenExpired', msg: 'Token Expired'}};
  // }
  console.log('verify success!');

  return {success: true};
  
}

exports.jwtSign = function (payload, secret) {
  console.log('payload: ', payload);

  let token = jwt.sign(payload, secret);
  return token;
}

exports.checkWhitlist = function (address, cb) {
  WhitelistModel.findOne({address: address})
    .then(white => {
      if (!white || white.status < 0) {
        cb('This address was blocked.', white);
      } else {
        cb(null, white);
      }
    })
    .catch(e => {
      cb('This address could not find in our system.', null);
    });
}