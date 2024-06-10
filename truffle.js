const HDWalletProvider = require('@truffle/hdwallet-provider');
const mnemonic = "rival empower awake poet captain core bracket swing ball office spend decade";

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    }
  },
  compilers: {
    solc: {
      version: "^0.4.24"  
    }
  }
};
