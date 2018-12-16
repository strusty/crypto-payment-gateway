const APISecret = require('../modules/apiSecrets');

exports.registerAPI = function(req, res) {
  let userid = req.body.userid;
  let appname = req.body.appname
  console.log("registerAPI: ", userid);

  APISecret.registerKey(userid, appname, function(err, keydata) {
    if (err) {
      console.log("registerAPI error: " + err);
      res.json({success: false, error: err});
      return;
    }

    console.log("keydata: " + keydata);
    res.json({success: true, data: keydata});
  })
}

exports.getApiKeyAPI = function(req, res) {
  let userid = req.body.userid;
  let appname = req.body.appname;
  console.log("getApiKeyAPI: ", userid, appname);

  APISecret.getApiKey(userid, appname, function(err, keydata) {
    if (err) {
      console.log("getApiKeyAPI error: " + err);
      res.json({success: false, error: err});
      return;
    }

    console.log("keydata: " + keydata);
    res.json({success: true, data: keydata});
  })
}

exports.getSecretAPI = function(req, res) {
  let userid = req.body.userid;
  let appname = req.body.appname;
  console.log("getSecretAPI: ", userid, appname);

  APISecret.getApiKey(userid, appname, function(err, keydata) {
    if (err) {
      console.log("getSecretAPI error: " + err);
      res.json({success: false, error: err});
      return;
    }

    console.log("keydata: " + keydata);
    res.json({success: true, data: keydata});
  })
}

exports.requestToken = function (req, res) {
  let userid = req.body.userid;
  let appname = req.body.appname;
  let apikey = req.body.apikey;

  if (!userid || !appname || !apikey) {
    return res.status(400).json({status: false, error: 'Invalid parameters.'});
  }

  APISecret.requestToken(apikey, appname, userid, function(err, token) {
    if (err) {
      console.log("get token error: " + err);
      res.json({success: false, error: err});
      return;
    }

    console.log("new token: " + token);
    res.json({success: true, token: token});
  });
}