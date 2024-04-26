const HDWalletProvider = require('@truffle/hdwallet-provider');
var mnemonic = "wasp type cash hair barely bleak approve convince drum sing uncle obscure";
var NonceTrackerSubprovider = require("web3-provider-engine/subproviders/nonce-tracker")

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      provider: function() {
        var wallet = new HDWalletProvider(mnemonic, "http://127.0.0.1:7545/")
        var nonceTracker = new NonceTrackerSubprovider()
        wallet.engine._providers.unshift(nonceTracker)
        nonceTracker.setEngine(wallet.engine)
        return wallet
        //return new HDWalletProvider(mnemonic, "http://127.0.0.1:7545/", 0, 50);
      },
      network_id: '5777',
      gas: 2000000,   // <--- Twice as much
      gasPrice: 10000000000,
    }
  },
  compilers: {
    solc: {
      version: "^0.4.24"
    }
  }
};