const HDWalletProvider = require('@truffle/hdwallet-provider');
var mnemonic = "index basket praise envelope false piano fringe labor void long thought need";

module.exports = {
  networks: {
    development: {
      networkCheckTimeout: 10000,
      host: "127.0.0.1",
      port: 7545,
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:7545/", 0, 50);
      },
      network_id: '5777',
      gas: 6721975
    }
  },
  compilers: {
    solc: {
      version: "^0.4.24"
    }
  }
};