var Test = require('../config/testConfig.js');

contract('Oracles', async (accounts) => {

  const TEST_ORACLES_COUNT = 20;
  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
  });

  it('can register oracles', async () => {
    let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();
    for(let a=1; a<TEST_ORACLES_COUNT; a++) {      
      await config.flightSuretyApp.registerOracle({ from: accounts[a], value: fee });
      let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
      console.log(`Oracle Registered: ${result[0]}, ${result[1]}, ${result[2]}`);
    }
  });

  it('can request flight status', async () => {
    let flight = 'ND1309'; // Flight number
    let timestamp = Math.floor(Date.now() / 1000);

    // Submit a request for oracles to get status information for a flight
    await config.flightSuretyApp.fetchFlightStatus(config.firstAirline, flight, timestamp, {from: config.owner});

    for(let a=1; a<TEST_ORACLES_COUNT; a++) {
      let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({ from: accounts[a]});
      for(let idx=0; idx<3; idx++) {
        try {
          // Submit a response...it will only be accepted if there is an Index match
          await config.flightSuretyApp.submitOracleResponse(oracleIndexes[idx], config.firstAirline, flight, timestamp, STATUS_CODE_ON_TIME, { from: accounts[a] });
        }
        catch(e) {
          console.log(`Error for oracle ${a} index ${idx}: ${oracleIndexes[idx]} for flight ${flight} at ${timestamp}`);
        }
      }
    }
  });
});
