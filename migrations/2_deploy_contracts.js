const FlightSuretyData = artifacts.require("FlightSuretyData");
const FlightSuretyApp = artifacts.require("FlightSuretyApp");

module.exports = function(deployer) {
  deployer.deploy(FlightSuretyData)
    .then(() => {
      return deployer.deploy(FlightSuretyApp, FlightSuretyData.address);
    });
};
