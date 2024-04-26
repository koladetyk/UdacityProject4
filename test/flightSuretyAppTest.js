var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {
    var config;
    let anOracle; // Oracle account

    before('setup contract', async () => {
        config = await Test.Config(accounts);
        await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);

        // Setup and register the oracle
        anOracle = accounts[2];
        // Ensure the oracle has enough ether to pay for the registration fee if required
        await web3.eth.sendTransaction({from: accounts[0], to: anOracle, value: web3.utils.toWei("1.5", "ether")});
        await config.flightSuretyApp.registerOracle({from: anOracle, value: web3.utils.toWei("1", "ether")});
    });

    it('has correct initial isOperational() value', async function () {
        // Check if the data contract is operational
        let status = await config.flightSuretyData.isOperational.call();
        assert.equal(status, true, "Incorrect initial operating status value");
    });

    it('can block access to setOperatingStatus() for non-Contract Owner account', async function () {
        let accessDenied = false;
        try {
            await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
        } catch(e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
    });

    it('can allow access to setOperatingStatus() for Contract Owner account', async function () {
        let accessDenied = false;
        try {
            await config.flightSuretyData.setOperatingStatus(false);
        } catch(e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, false, "Access should not be restricted to Contract Owner");
        // Set it back for other tests to work
        await config.flightSuretyData.setOperatingStatus(true);
    });

    it('can register a flight', async () => {
        let airline = config.firstAirline;
        let flight = 'ND1309'; // Example flight number
        let timestamp = Math.floor(Date.now() / 1000);
        await config.flightSuretyApp.registerFlight(airline, flight, timestamp, {from: airline});
        let result = await config.flightSuretyApp.isFlightRegistered(airline, flight, timestamp);
        assert.equal(result, true, "Flight should be registered successfully.");
    });

    it('can submit oracle response', async () => {
        let indexes = await config.flightSuretyApp.getMyIndexes({from: anOracle});
        let airline = config.firstAirline;
        let flight = 'ND1309';
        let timestamp = Math.floor(Date.now() / 1000);
        let statusCode = 20; // Example status code indicating a delay

        // Fetch flight status to open the request for oracles
        await config.flightSuretyApp.fetchFlightStatus(airline, flight, timestamp);

        // Oracles submit their response
        for (let idx = 0; idx < indexes.length; idx++) {
            await config.flightSuretyApp.submitOracleResponse(indexes[idx], airline, flight, timestamp, statusCode, {from: anOracle});
        }

        // Check that the flight status is updated after sufficient responses
        let updatedStatus = await config.flightSuretyData.getFlightStatus(airline, flight, timestamp);
        assert.equal(updatedStatus, statusCode, "Flight status should be updated based on oracle consensus.");
    });

    it('processes insurance payouts correctly', async () => {
        let passenger = accounts[5];
        let insuranceAmount = web3.utils.toWei("1", "ether");
        let flight = 'ND1309';
        let timestamp = Math.floor(Date.now() / 1000);
    
        // Passenger buys insurance
        await config.flightSuretyData.buy(config.firstAirline, flight, timestamp, {from: passenger, value: insuranceAmount});
    
        // Flight is delayed
        await config.flightSuretyData.creditInsurees(config.firstAirline, flight, timestamp);
    
        // Passenger requests payout
        let initialBalance = await web3.eth.getBalance(passenger);
        await config.flightSuretyData.pay({from: passenger});
        let newBalance = await web3.eth.getBalance(passenger);
    
        assert.isAbove(Number(newBalance), Number(initialBalance), "Passenger balance should increase after receiving payout.");
    });
    
});
