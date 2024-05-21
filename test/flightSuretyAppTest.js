var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {
    var config;
    before('setup contract', async () => {
        config = await Test.Config(accounts);
        await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    });

    /********************************************************************************************/
    /* Tests for operational status controls                                                    */
    /********************************************************************************************/
    it('has correct initial isOperational() value', async function () {
        let status = await config.flightSuretyApp.isOperational.call();
        assert.equal(status, true, "Incorrect initial operating status value");
    });

    it('can block access to setOperatingStatus() for non-Contract Owner account', async function () {
        let accessDenied = false;
        try {
            await config.flightSuretyApp.setOperatingStatus(false, { from: accounts[2] });
        } catch(e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
    });

    /********************************************************************************************/
    /* Tests for airline registration                                                           */
    /********************************************************************************************/
    it('can register an airline through the FlightSuretyApp', async () => {
        let newAirline = accounts[2];
        await config.flightSuretyApp.registerAirline(newAirline, {from: config.owner});
        let result = await config.flightSuretyData.isAirlineRegistered(newAirline);
        assert.equal(result, true, "Airline should be registered successfully.");
    });

    /********************************************************************************************/
    /* Tests for flight registration                                                            */
    /********************************************************************************************/
    it('can register a flight', async () => {
        let newAirline = accounts[2];
        let flight = 'ND1309';
        let timestamp = Math.floor(Date.now() / 1000);
        await config.flightSuretyApp.registerFlight(newAirline, flight, timestamp, {from: newAirline});
        let result = await config.flightSuretyApp.isFlightRegistered(newAirline, flight, timestamp);
        assert.equal(result, true, "Flight should be registered successfully.");
    });

    /********************************************************************************************/
    /* Tests for oracles                                                                        */
    /********************************************************************************************/
    it('can request flight status', async () => {
        let airline = accounts[2];
        let flight = 'ND1309';
        let timestamp = Math.floor(Date.now() / 1000);
        let tx = await config.flightSuretyApp.fetchFlightStatus(airline, flight, timestamp);
        assert(tx.logs[0].event, 'OracleRequest', 'Fetch flight status should trigger OracleRequest event');
    });

    /********************************************************************************************/
    /* Tests for insurance payouts                                                              */
    /********************************************************************************************/
    it('can allow a user to buy insurance and get credit', async () => {
        let passenger = accounts[5];
        let airline = accounts[2];
        let flight = 'ND1309';
        let timestamp = Math.floor(Date.now() / 1000);
        let insuranceAmount = web3.utils.toWei("1", "ether");
        await config.flightSuretyData.buy(airline, flight, timestamp, {from: passenger, value: insuranceAmount});
        // Simulate flight delay
        await config.flightSuretyData.creditInsurees(airline, flight, timestamp, {from: config.owner});
        let payout = await config.flightSuretyData.getCreditedAmount(passenger);
        assert(payout.toString(), web3.utils.toWei("1.5", "ether"), "Insurance should be credited properly.");
    });

});
