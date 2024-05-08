const HDWalletProvider = require('@truffle/hdwallet-provider');
const mnemonic = "conduct elephant pupil follow prepare need science price someone fitness object slow";

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
