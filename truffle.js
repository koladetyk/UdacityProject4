const HDWalletProvider = require('@truffle/hdwallet-provider');
const mnemonic = "rival empower awake poet captain core bracket swing ball office spend decade";

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
