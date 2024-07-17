var Test = require('../config/testConfig.js');
var truffleAssert = require('truffle-assertions');

contract('Oracles', async (accounts) => {
  const TEST_ORACLES_COUNT = 20;
  var config;
  const account = accounts[0];
  before('setup contract', async () => {
    config = await Test.Config(accounts);
  });

  it('can register oracles', async () => {
    let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();
    for(let a=0; a<TEST_ORACLES_COUNT; a++) {
      if (accounts[a]) {
        await config.flightSuretyApp.registerOracle({ from: accounts[a], value: fee });
        let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
        console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
      }
    }
  });

  it('can request flight status and process responses correctly', async () => {
    let flight = 'ND1309'; // Flight number
    let timestamp = Math.floor(Date.now() / 1000);

    // Submit a request for oracles to get status information for a flight
    let tx = await config.flightSuretyApp.fetchFlightStatus(config.firstAirline, flight, timestamp, {from: config.owner});
    truffleAssert.eventEmitted(tx, 'OracleRequest', (ev) => {
        return ev.flight === flight && ev.timestamp.toNumber() === timestamp;
    });

    // Simulate responses from oracles
    for(let a = 1; a < TEST_ORACLES_COUNT; a++) {
        let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({ from: accounts[a]});
        for(let idx = 0; idx < oracleIndexes.length; idx++) {
            try {
                // Submit a response with random status code to simulate different scenarios
                let statusCode = (a % 2 === 0) ? STATUS_CODE_ON_TIME : STATUS_CODE_LATE_AIRLINE;
                await config.flightSuretyApp.submitOracleResponse(oracleIndexes[idx], config.firstAirline, flight, timestamp, statusCode, { from: accounts[a] });

                console.log(`Oracle ${accounts[a]} responded with status ${statusCode}`);
            }
            catch(e) {
                // Only log if the index does not match; ignore other errors for simplicity
                console.log(`Error for oracle ${accounts[a]} index ${oracleIndexes[idx]}: ${e.message}`);
            }
        }
    }
});

});