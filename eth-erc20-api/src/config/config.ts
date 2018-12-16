const config = {
  development: {
    PORT: 3000,
    MONGODB_URI: 'mongodb://127.0.0.1:27017/ethereum',

    WALLET_PASSWORD: '',
    ETH_PROVIDER: 'http://127.0.0.1:8545',

    PKSECRET: '',
    SECRETPATH: '',
  },
  production: {
    PORT: 3000,
    MONGODB_URI: 'mongodb://127.0.0.1:27017/ethereum',

    WALLET_PASSWORD: '',
    ETH_PROVIDER: 'http://127.0.0.1:8545',

    PKSECRET: '',
    SECRETPATH: '',
  }
};

exports.get = function get(env) {
  return config[env] || config.development;
}