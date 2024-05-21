const HDWalletProvider = require('@truffle/hdwallet-provider');
const mnemonic = "method fatigue bacon bitter rigid whip game fall tunnel law giant concert";

module.exports = {
  networks: {
    development: {
      provider: () => new HDWalletProvider(mnemonic, "http://127.0.0.1:7545/"),
      network_id: '5777',
      gas: 10000000,
      gasPrice: 20000000000
    }
  },
  compilers: {
    solc: {
      version: "^0.4.24"  
    }
  }
};
