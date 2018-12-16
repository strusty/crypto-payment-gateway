const config = {
	development: {
		PORT: 8001,

		BTC_RPC_HOST: "174.138.7.213",
		BTC_RPC_PORT: 18332,
		BTC_RPC_USER: "btc",
		BTC_RPC_PASS: "pass",
	},
	production: {
		PORT: 8080,

		BTC_RPC_HOST: "127.0.0.1",
		BTC_RPC_PORT: 18332,
		BTC_RPC_USER: "btc",
		BTC_RPC_PASS: "pass",
	}
};

exports.get = function get(env) {
	return config[env] || config.development;
}