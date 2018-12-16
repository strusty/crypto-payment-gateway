const config = {
  development: {
    PORT: 3000,
    MONGODB_URI: 'mongodb://127.0.0.1:27017/ubiq',

    WALLET_PASSWORD: '',
    UBIQ_PROVIDER: 'http://127.0.0.1:8588',

    PKSECRET: '',
    SECRETPATH: '',
  },
  production: {
    PORT: 3000,
    MONGODB_URI: 'mongodb://127.0.0.1:27017/ubiq',

    WALLET_PASSWORD: '',
    UBIQ_PROVIDER: 'http://127.0.0.1:8588',

    PKSECRET: '',
    SECRETPATH: '',
  }
};

exports.get = function get(env) {
  return config[env] || config.development;
}