const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config(); // Load environment variables from .env

const mnemonic = process.env.MNEMONIC;

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
