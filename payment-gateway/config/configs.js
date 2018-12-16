var config = {
  production: {
    port: 8080,
    serverip: "https://api.worldbit.com",
    db: 'mongodb://127.0.0.1:27017/payment_gateway',
    supportCoins: [
      "BTC",     //Bitcoin
      "ETH",    //Ethereum
      "ERC",   //ERC-20 token
      "UBQ",  //Ubiq
      "UBQERC",  //Ubiq ERC20 tokens
    ],

    COINFULLNAME: {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      ERC: 'erc20',
      UBQ: 'ubiq',
      UBQERC: 'ubiqerc20',
    },

    node_api_url: {
      BTC: "http://10.142.0.6",
      ETH: "http://10.142.0.9",
      ERC: "http://10.142.0.9:3000",
      UBQ: "http://10.142.0.7",
      UBQERC: "http://10.142.0.7:3000"
    },

    company_account: {
      ETH: {
        address: "0x6d5E4F012b1cC3700EdB43B19A16E93A0AeCA5EE",
        account: "wbex"
      },
      BTC: {
        address: "31xYB6AcuUbktHvWZiw6jQEDmC1sKnEesY",
        account: "wbex"
      },
      UBQ: {
        address: "0xf7428Dd6Ba4Fe4565238A94aEDB711563830ae09",
        account: "wbex"
      }
    },

    commission_account: {
      ETH: {
        address: "0x3bB93867ceE64e7541653c298f9E59ce38652e81",
        account: "commission"
      },
      BTC: {
        address: "1Jh7X9JKJD2EjNHwdBtpsJ4p75ELm6WmGR",
        account: "commission"
      },
      UBQ: {
        address: "0xfB987424125dDEcfdCb9A3B49F8342a2A6FB4c4C",
        account: "commission"
      }
    },

    ETHERSCAN_API_KEY: "EHGEMXBSSQ45BBN897AA48EGG8R8FWQGXU",
    ETH_NETWORK: "main",

    CONFIRM_COUNT: 2, 
    SYSTEM_FEE: 0.01,

    INTERVAL_UPDATE_TRANSACTION: 2000,
    INTERVAL_UPDATE_BALANCE: 5000,
    INTERVAL_UPDATE_COINPRICE: 60000,

    IPN_URL: "https://intel.worldbit.com/ipn_handler.php",

    TIMEOUT: 21600000, 

    MERCHANT: "",
    
    SPARKPOST_KEY: 'b0d45c98f621aabe2a24d1adcd3832dae324368e',

    BTC_TRANSACTION_FEE: 0.00005,
    ETH_TRANSACTION_FEE: 0.00042,

    TRANSACTION_FEE: {
      ETH: 0.00042,
      UBQ: 0.00042,
      BTC: 0.00005
    },

    NEXMO_KEY: '1982e46b',
    NEXMO_SECRET: 'Ss1oYWgj5FRjI2qz',
  },
  development: {
    port: 8080,
    serverip: "https://api.worldbit.com",
    db: 'mongodb://127.0.0.1:27017/payment_gateway',
    supportCoins: [
      "BTC",     //Bitcoin
      "ETH",    //Ethereum
      "ERC",   //ERC-20 token
      "UBQ",  //Ubiq
      "UBQERC",  //Ubiq ERC20 tokens
    ],

    COINFULLNAME: {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      ERC: 'erc20',
      UBQ: 'ubiq',
      UBQERC: 'ubiqerc20',
    },

    node_api_url: {
      BTC: "http://10.142.0.6",
      ETH: "http://10.142.0.9",
      ERC: "http://10.142.0.9:3000",
      UBQ: "http://10.142.0.7",
      UBQERC: "http://10.142.0.7:3000"
    },

    company_account: {
      ETH: {
        address: "0x6d5E4F012b1cC3700EdB43B19A16E93A0AeCA5EE",
        account: "wbex"
      },
      BTC: {
        address: "31xYB6AcuUbktHvWZiw6jQEDmC1sKnEesY",
        account: "wbex"
      },
      UBQ: {
        address: "0xf7428Dd6Ba4Fe4565238A94aEDB711563830ae09",
        account: "wbex"
      }
    },

    commission_account: {
      ETH: {
        address: "0x3bB93867ceE64e7541653c298f9E59ce38652e81",
        account: "commission"
      },
      BTC: {
        address: "1Jh7X9JKJD2EjNHwdBtpsJ4p75ELm6WmGR",
        account: "commission"
      },
      UBQ: {
        address: "0xfB987424125dDEcfdCb9A3B49F8342a2A6FB4c4C",
        account: "commission"
      }
    },

    ETHERSCAN_API_KEY: "EHGEMXBSSQ45BBN897AA48EGG8R8FWQGXU",
    ETH_NETWORK: "ropsten",

    CONFIRM_COUNT: 2, 
    SYSTEM_FEE: 0.01,
    
    INTERVAL_UPDATE_TRANSACTION: 2000,
    INTERVAL_UPDATE_BALANCE: 5000,
    INTERVAL_UPDATE_COINPRICE: 60000,

    IPN_URL: "https://intel.worldbit.com/ipn_handler.php",

    TIMEOUT: 21600000, 

    MERCHANT: "",
    
    SPARKPOST_KEY: 'b0d45c98f621aabe2a24d1adcd3832dae324368e',

    JWT_ISS: 'chainpayments',
    BTC_TRANSACTION_FEE: 0.00005,
    ETH_TRANSACTION_FEE: 0.00042,

    TRANSACTION_FEE: {
      ETH: 0.00042,
      UBQ: 0.00042,
      BTC: 0.00005
    },

    NEXMO_KEY: '1982e46b',
    NEXMO_SECRET: 'Ss1oYWgj5FRjI2qz',
  },
  default: {
    port: 8080,
    serverip: "https://api.worldbit.com",
    db: 'mongodb://127.0.0.1:27017/payment_gateway',
    supportCoins: [
      "BTC",     //Bitcoin
      "ETH",    //Ethereum
      "ERC",   //ERC-20 token
      "UBQ",  //Ubiq
      "UBQERC",  //Ubiq ERC20 tokens
    ],

    COINFULLNAME: {
      BTC: 'bitcoin',
      ETH: 'ethereum',
      ERC: 'erc20',
      UBQ: 'ubiq',
      UBQERC: 'ubiqerc20',
    },

    node_api_url: {
      BTC: "http://10.142.0.6",
      ETH: "http://10.142.0.9",
      ERC: "http://10.142.0.9:3000",
      UBQ: "http://10.142.0.7",
      UBQERC: "http://10.142.0.7:3000"
    },

    company_account: {
      ETH: {
        address: "0x6d5E4F012b1cC3700EdB43B19A16E93A0AeCA5EE",
        account: "wbex"
      },
      BTC: {
        address: "31xYB6AcuUbktHvWZiw6jQEDmC1sKnEesY",
        account: "wbex"
      },
      UBQ: {
        address: "0xf7428Dd6Ba4Fe4565238A94aEDB711563830ae09",
        account: "wbex"
      }
    },

    commission_account: {
      ETH: {
        address: "0x3bB93867ceE64e7541653c298f9E59ce38652e81",
        account: "commission"
      },
      BTC: {
        address: "1Jh7X9JKJD2EjNHwdBtpsJ4p75ELm6WmGR",
        account: "commission"
      },
      UBQ: {
        address: "0xfB987424125dDEcfdCb9A3B49F8342a2A6FB4c4C",
        account: "commission"
      }
    },

    ETHERSCAN_API_KEY: "EHGEMXBSSQ45BBN897AA48EGG8R8FWQGXU",
    ETH_NETWORK: "ropsten",

    CONFIRM_COUNT: 2, 
    SYSTEM_FEE: 0.01,
    
    INTERVAL_UPDATE_TRANSACTION: 2000,
    INTERVAL_UPDATE_BALANCE: 5000,
    INTERVAL_UPDATE_COINPRICE: 60000,

    IPN_URL: "https://intel.worldbit.com/ipn_handler.php",

    TIMEOUT: 21600000, 

    MERCHANT: "",
    
    SPARKPOST_KEY: 'b0d45c98f621aabe2a24d1adcd3832dae324368e',

    JWT_ISS: 'chainpayments',
    BTC_TRANSACTION_FEE: 0.00005,

    TRANSACTION_FEE: {
      ETH: 0.00042,
      UBQ: 0.00042,
      BTC: 0.00005
    },

    NEXMO_KEY: '1982e46b',
    NEXMO_SECRET: 'Ss1oYWgj5FRjI2qz',
  }
}

exports.get = function get(env) {
  return config[env] || config.default;
}