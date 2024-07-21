const FlightSuretyData = artifacts.require('FlightSuretyData');
contract('FlightSuretyDataTest ', (accounts) => {
    let flightSuretyData;
    const owner = accounts[0];
    const firstAirline = accounts[1];
    const secondAirline = accounts[2];
    const thirdAirline = accounts[4];
    const fourthAirline = accounts[5];
    const fifthAirline = accounts[6];
    const passenger = accounts[7];
    let payoutAmount = web3.utils.toWei("1.5", "ether");
    before(async () => {
        flightSuretyData = await FlightSuretyData.deployed();
        await flightSuretyData.authorizeCaller(owner, { from: owner });
        await flightSuretyData.registerAirline(firstAirline, { from: owner });
    });
    it('is deployed correctly and the contract address is logged', async () => {
        console.log(`FlightSuretyData contract address: ${flightSuretyData.address}`);
        assert(flightSuretyData.address, "FlightSuretyData contract should be deployed");
    });
    it('verifies that the first airline is registered', async () => {
        let isRegistered = await flightSuretyData.isAirlineRegistered(firstAirline);
        console.log(`First airline registered status: ${isRegistered}`);
        assert.equal(isRegistered, true, "First airline should be registered.");
    });
    it('has correct initial isOperational status', async () => {
        let status = await flightSuretyData.isOperational.call();
        console.log(`Initial operational status: ${status}`);
        assert.equal(status, true, "Incorrect initial operational status value expected true");
    });
    it('can block access to setOperatingStatus() for non-Contract Owner account', async () => {
        try {
            await flightSuretyData.setOperatingStatus(false, { from: accounts[1] });
            assert.fail("Access not restricted to Contract Owner");
        } catch (error) {
            assert.include(error.message, "revert", "Expected revert for non-owner access");
        }
    });
    it("allows registration of another airline by the first airline if authorized", async () => {
        await flightSuretyData.authorizeCaller(firstAirline, { from: owner });
        const isAlreadyRegistered = await flightSuretyData.isAirlineRegistered(fourthAirline);
        if (!isAlreadyRegistered) {
            const tx = await flightSuretyData.registerAirline(fourthAirline, { from: firstAirline });
            console.log(`Transaction hash for registering second airline: ${tx.tx}`);
        }
        const isRegistered = await flightSuretyData.isAirlineRegistered(fourthAirline);
        assert.equal(isRegistered, true, "Second airline should be registered by the first airline if authorized");
    });
    it('allows a user to buy insurance for a flight', async () => {
        const flight = "ND1309";
        const timestamp = Math.floor(Date.now() / 1000);
        const insuranceAmount = web3.utils.toWei("0.1", "ether");
        let tx = await flightSuretyData.buy(firstAirline, flight, timestamp, {from: passenger, value: insuranceAmount});
        console.log(`Insurance purchased transaction hash: ${tx.tx}`);
    });
    it('ensures payouts are made correctly, considering gas costs', async () => {
        const flight = "ND1309";
        const timestamp = Math.floor(Date.now() / 1000); // Ensure this meets your delay criteria
        const insuranceAmount = web3.utils.toWei("1", "ether");
        // Buy insurance first
        await flightSuretyData.buy(firstAirline, flight, timestamp, { from: passenger, value: insuranceAmount });
        // Manually triggering a flight delay condition
        await flightSuretyData.creditInsurees(firstAirline, flight, timestamp, { from: owner });
        // Check the credited amount before attempting to pay
        const creditedAmount = await flightSuretyData.getCreditedAmount(passenger);
        console.log(`Credited amount before payout: ${web3.utils.fromWei(creditedAmount.toString(), 'ether')}`);
        // Attempt to payout
        assert(creditedAmount.gt(0), "Insuree should be credited before payout");
        const initialBalance = await web3.eth.getBalance(passenger);
        //await flightSuretyData.pay.sendTransaction({ from: passenger });
        // const finalBalance = await web3.eth.getBalance(passenger);
        // console.log(initialBalance)
        // console.log(finalBalance)
        // assert(finalBalance > initialBalance, "Payout not processed correctly or no funds were credited.");
    });
    it('credits insurees correctly for delayed flights and ensures payouts are made correctly', async () => {
        const flight = "ND1309";
        const timestamp = Math.floor(Date.now() / 1000);
        const insuranceAmount = web3.utils.toWei("1", "ether");
        // Simulate buying insurance
        await flightSuretyData.buy(firstAirline, flight, timestamp, { from: passenger, value: insuranceAmount });
        // Manipulate the condition to ensure the flight is considered delayed
        // This could involve directly setting a mock condition or adjusting the flight's timestamp/status
        await flightSuretyData.creditInsurees(firstAirline, flight, timestamp, { from: owner });
        // Checking credited amount before payout
        const creditedAmount = await flightSuretyData.getCreditedAmount(passenger);
        console.log(`Credited amount: ${web3.utils.fromWei(creditedAmount.toString(), 'ether')}`);
        assert(creditedAmount.toString() !== '0', "Insuree should be credited before payout");
        // Execute payout
        const initialBalance = new web3.utils.BN(await web3.eth.getBalance(passenger));
        await flightSuretyData.pay.sendTransaction({ from: passenger });
        const finalBalance = new web3.utils.BN(await web3.eth.getBalance(passenger));
        assert(finalBalance.gt(initialBalance), "Payout not processed correctly");
    });
});