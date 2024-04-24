const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');

module.exports = function(deployer) {
    deployer.deploy(FlightSuretyData).then((data) => {
        return deployer.deploy(FlightSuretyApp, data.address)  // Pass the correct address of the deployed data contract
        .then((app) => {
            let config = {
                localhost: {
                    url: 'http://localhost:8545',
                    dataAddress: data.address,  // Use the instance address
                    appAddress: app.address    // Use the instance address
                }
            };
            fs.writeFileSync(__dirname + '/../src/dapp/config.json', JSON.stringify(config, null, '\t'), 'utf-8');
            fs.writeFileSync(__dirname + '/../src/server/config.json', JSON.stringify(config, null, '\t'), 'utf-8');
        });
    });
};
