const FlightSuretyData = artifacts.require("FlightSuretyData");
const FlightSuretyApp = artifacts.require("FlightSuretyApp");

module.exports = async function(deployer) {
  await deployer.deploy(FlightSuretyData);
  const flightSuretyData = await FlightSuretyData.deployed();

  await deployer.deploy(FlightSuretyApp, flightSuretyData.address);
};
