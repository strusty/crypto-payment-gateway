const crypto = require('crypto');
const ApiKeysModel = require('../models/apiKeys');
const AuthUtils = require('../utils/authUtils');
const randomstring = require('randomstring');

//apiSecrets generate Api key from registered user id and registered time.
function generateApiKey(userid, createTime) {
  var body = userid + createTime.toString();
  var crypted = crypto.createHash('sha256').update(body).digest("hex");

  console.log("----------- ApiKey ---------------");
  console.log(crypted);
  return crypted;
}

// generate Api key from registered user id and registered time.
function generateSecret(appname, seed) {
  var secretbody = appname + seed;
  var secret = crypto.createHash('sha256').update(secretbody.substring(0, 64)).digest("hex");

  console.log("----------- Secret ---------------");
  console.log(secret);
  return secret;
}

// generate Api key from registered user id and registered time.
function generateMerchant(appname, createTime) {
  var body = appname + createTime.toString();
  var merchant = crypto.createHash('sha256').update(body).digest("hex");

  console.log("----------- Merchant ID ---------------");
  console.log(merchant);
  return merchant;
}

function Bin2String(bytearray) {
  var result = "";
  for (var i = 0; i < bytearray.length; i++) {
    result += bytearray[i].toString();
  }
  return result;
}

exports.registerKey = function(userid, appname, callback) {
  ApiKeysModel.findOne({userid: userid, appname: appname}, function(err, keydata) {
    if (err) {
      console.log("registerKey error: " + err);
      if (callback)
        callback(err, {});
      return;
    }

    if (keydata) {
      console.log("already registered");
      if (callback)
        callback("already registered", keydata);
      return;
    }

    let created = Date.now(); 
    let seed = Bin2String(crypto.randomBytes(256)); 
    var keydata = {
      userid: userid,
      appname: appname,
      created: created,
      seed: seed,
      permission:{read:1, write:1},
      key: generateApiKey(userid, created),
      secret: generateSecret(appname, seed),
      merchant: generateMerchant(appname, created)
    }

    newKeyData = new ApiKeysModel(keydata);

    newKeyData.save(function(err) {
      if (err) {
        console.log("registerkey: " + err);
        if (callback)
          callback(err, {});
        return;
      }

      if (callback)
        callback(err, keydata);
    })
  })
}

exports.getApiKey = function(userid, appname, callback) {
  ApiKeysModel.findOne({userid: userid, appname: appname}, function(err, keydata) {
    if (err) {
      console.log("getApiKey error: " + err);
      if (callback)
        callback(err, "");
      return;
    }

    if (callback)
      callback(err, keydata ? keydata.key : "");
  })
}

exports.getSecret = function(userid, appname, callback) {
  ApiKeysModel.findOne({userid: userid, appname: appname}, function(err, keydata) {
    if (err) {
      console.log("getSecret error: " + err);
      if (callback)
        callback(err, "");
      return;
    }

    if (callback)
      callback(err, keydata ? keydata.secret : "");
  })
}

exports.getUserID = function(key, appname, callback) {
  ApiKeysModel.findOne({key: key, appname: appname}, function(err, keydata) {
    if (err) {
      console.log("getUserID error: " + err);
      if (callback)
        callback(err, "");
      return;
    }

    if (callback)
      callback(err, keydata ? keydata.userid : "");
  })
}

exports.getSecretFromKey = function(key, appname, callback) {
  ApiKeysModel.findOne({key: key, appname: appname}, function(err, keydata) {
    if (err) {
      console.log("getUserID error: " + err);
      if (callback)
        callback(err, "");
      return;
    }

    if (callback)
      callback(err, keydata ? keydata.secret : "");
  })
}

exports.requestToken = function (apikey, appname, userid, callback) {
  ApiKeysModel.findOne({key: apikey, appname: appname, userid: userid}, function(err, keydata) {
    if (err || !keydata) {
      console.log("request token error: " + err);
      if (callback) {
        callback("Invalid apiKey, appname and userid.", "");
      }
      return;
    }

    if (callback) {
      let issuer = randomstring.generate(8);
      keydata.issuer = issuer;

      keydata.save()
        .then(res => {
          let payload = {
            exp: parseInt(Date.now() / 1000) + 3600,
            iss: issuer,
            key: apikey,
          };

          let token = AuthUtils.jwtSign(payload, keydata.secret);
          callback(null, token);
        })
        .catch(err => {
          console.log('Failed to save new issuer: ', err);
          callback(err, "");
        });
    }
  })
}

exports.verifyKey = function (key, appname, timestamp, hash) {
  ApiKeysModel.findOne({key: key, appname: appname}, function(err, keydata) {
    if (err) {
      console.log("verifyKey error: " + err);
      return {success: false, error: err};
    }

    if (!keydata) {
      console.log("verifyKey: no data");
      return {success: false, error: "no key data"};
    }

    var text = key + timestamp;
    var crypted = crypto.createHmac('sha256', keydata.secret).update(text).digest("hex");

    return {success: true, value: hash == crypted? true: false, userid: keydata.userid};
  })
}

exports.removeApiKey = function(userid, appname, callback) {
  ApiKeysModel.remove({userid: userid, appname: appname}, function(err) {
    if (err) {
      console.log("removeApiKey error: " + err);
    }

    if (callback)
      callback(err);
  })
}

//sample: verifyAtSocket(socket, "order result", order)
exports.verifyAtSocket = async function(socket, emitMsg, info) {
  var result;
  if (info.Authorization != undefined) {
    try {
      result = AuthUtils.jwtVerify(info.Authorization);

      if (!result.success) {
        socket.emit(emitMsg, {success: false, error: result.error});
        console.log("verifyAtSocket error", result.error);
        return {success: false, msg: result.error};
      }
      info.userid = result.userid;
      delete info.Authorization;
    }
    catch(e) {
      socket.emit(emitMsg, {success: false, error: e});
      console.log("verifyAtSocket error ", e);
      return {success: false, msg: e};
    }
  }
  else if (info.APIKey != undefined) {
    result = await Verify(info.APIKey, info.timestamp, info.hash);

    if (!result.success) {
      socket.emit(emitMsg, {success: false, error: result.error});
      console.log("verifyAtSocket error", result.error);
      return {success: false, msg: result.error};
    }

    //not verified
    if (!result.value) {
      socket.emit(emitMsg, {success: false, error: "Autorization failed"});
      console.log("verifyAtSocket authorization error");
      return {success: false, msg: "authorization failed"};
    }

    info.userid = result.userid;
    delete info.APIKey;
    delete info.timestamp;
    delete info.hash;
  }

  return {success: true, data: info};
}