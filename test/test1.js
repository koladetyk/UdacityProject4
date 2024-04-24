const FlightSuretyData = artifacts.require("FlightSuretyData");

contract("FlightSuretyData", (accounts) => {
  let flightSuretyData;
  const owner = accounts[0];
  const firstAirline = accounts[1];

  before(async () => {
    flightSuretyData = await FlightSuretyData.deployed();
    console.log("Contract deployed at:", flightSuretyData.address);
    await flightSuretyData.registerAirline(firstAirline, { from: owner });
    });


  it("should have registered the first airline", async () => {
    const isRegistered = await flightSuretyData.isAirlineRegistered(firstAirline);
    assert.equal(isRegistered, true, "The first airline was not registered.");
  });
});
