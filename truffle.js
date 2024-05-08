const HDWalletProvider = require('@truffle/hdwallet-provider');
const mnemonic = "audit harbor mule grunt congress flame three vocal hockey prosper afford primary";

module.exports = {
  networks: {
    development: {
      provider: () => new HDWalletProvider(mnemonic, "http://127.0.0.1:7545/"),
      network_id: '5777',
      gas: 6721975,
      gasPrice: 20000000000
    }
  },
  compilers: {
    solc: {
      version: "^0.4.24"  
    }
  }
};
