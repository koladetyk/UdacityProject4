var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {
    var config;
    before('setup contract', async () => {
        config = await Test.Config(accounts);
        
        // Add a check here to log which account is considered the owner
        console.log("Owner address from config:", config.owner);
        console.log("Current account trying to authorize:", config.flightSuretyApp.address);

        // Authorize the app contract
        //await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address, {from: config.owner});
        console.log("Authorizing App with Data contract using owner:", config.owner);

        await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address, { from: config.owner });


        // Register the first airline
        await config.flightSuretyApp.registerAirline(config.firstAirline, { from: config.owner });
    });

    /****************************************************************************************/
    /* Operations and Settings                                                              */
    /****************************************************************************************/

    it(`(multiparty) has correct initial isOperational() value`, async function () {
        // Get operating status
        let status = await config.flightSuretyData.isOperational.call();
        assert.equal(status, true, "Incorrect initial operating status value");
    });

    it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {
        // Ensure that access is denied for non-Contract Owner account
        let accessDenied = false;
        try {
            await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
        } catch (e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
    });

    it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {
        // Ensure that access is allowed for Contract Owner account
        let accessDenied = false;
        try {
            await config.flightSuretyData.setOperatingStatus(false, { from: config.owner });
        } catch (e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, false, "Access should be allowed for Contract Owner");
    });

    it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {
        await config.flightSuretyData.setOperatingStatus(false);

        let reverted = false;
        try {
            await config.flightSuretyApp.registerFlight("Test Flight", Math.floor(Date.now() / 1000), { from: config.firstAirline });
        } catch (e) {
            reverted = true;
        }
        assert.equal(reverted, true, "Access not blocked for requireIsOperational");

        // Set it back for other tests to work
        await config.flightSuretyData.setOperatingStatus(true);
    });

    it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {
        // Arrange
        let newAirline = accounts[2];

        // Act
        let reverted = false;
        try {
            await config.flightSuretyApp.registerAirline(newAirline, { from: newAirline });
        } catch (e) {
            reverted = true;
        }
        let result = await config.flightSuretyData.isAirlineRegistered(newAirline);

        // Assert
        assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");
        assert.equal(reverted, true, "Should revert due to not being funded");
    });
});
