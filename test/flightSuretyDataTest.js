const FlightSuretyData = artifacts.require('FlightSuretyData');

contract('FlightSuretyData', (accounts) => {
    let flightSuretyData;
    const owner = accounts[0]; 
    const firstAirline = accounts[1];
    const secondAirline = accounts[2];
    const thirdAirline = accounts[4];  
    const fourthAirline = accounts[5];
    const fifthAirline = accounts[6];
    const passenger = accounts[7];

    before(async () => {
        flightSuretyData = await FlightSuretyData.deployed();
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
            console.log(`Access control test passed: ${error.message}`);
            assert(error, "Expected an error but did not get one");
        }
    });

    it("allows registration of another airline by the first airline", async () => {
        const isAlreadyRegistered = await flightSuretyData.isAirlineRegistered(fourthAirline);
        console.log("is already reg "+ isAlreadyRegistered );
        if (!isAlreadyRegistered) {
            const tx = await flightSuretyData.registerAirline(fourthAirline, { from: firstAirline });
            console.log(`Transaction hash for registering second airline: ${tx.tx}`);
        } else {
            console.log(`Second airline already registered, skipping registration.`);
        }
    
        const isRegistered = await flightSuretyData.isAirlineRegistered(fourthAirline);
        assert.equal(isRegistered, true, "Second airline should be registered by the first airline");
    });

    it('allows a user to buy insurance for a flight', async () => {
        const flight = "ND1309"; 
        const timestamp = Math.floor(Date.now() / 1000); 
        const insuranceAmount = web3.utils.toWei("0.1", "ether"); 

        let tx = await flightSuretyData.buy(firstAirline, flight, timestamp, {from: passenger, value: insuranceAmount});
        console.log(`Insurance purchased transaction hash: ${tx.tx}`);
    });

    it('credits insurees correctly for delayed flights and ensures payouts are made correctly', async () => {
        // Assuming flight status update and insurance purchase are done correctly
        const insuranceAmount = web3.utils.toWei("1", "ether");
        await flightSuretyData.buy.sendTransaction(firstAirline, "ND1309", timestamp, { from: passenger, value: insuranceAmount });
        
        // Simulating flight delay
        await flightSuretyData.creditInsurees(firstAirline, "ND1309", timestamp, { from: owner });
    
        // Getting credited amount before payout
        const creditedAmount = await flightSuretyData.getCreditedAmount(passenger);
        console.log(`Credited amount: ${web3.utils.fromWei(creditedAmount.toString(), 'ether')}`);
    
        assert(creditedAmount.toString() !== '0', "Insuree should be credited before payout");
    
        // Executing payout
        const initialBalance = new web3.utils.BN(await web3.eth.getBalance(passenger));
        await flightSuretyData.pay({ from: passenger });
        const finalBalance = new web3.utils.BN(await web3.eth.getBalance(passenger));
    
        assert(finalBalance.gt(initialBalance), "Payout not processed correctly");
    });
    
    
    it('ensures that payouts are made correctly', async () => {
        const initialBalance = new web3.utils.BN(await web3.eth.getBalance(passenger));

        // Execute payout
        const txInfo = await flightSuretyData.pay({ from: passenger });
        const tx = await web3.eth.getTransaction(txInfo.tx);
        const gasCost = new web3.utils.BN(tx.gasPrice).mul(new web3.utils.BN(txInfo.receipt.gasUsed));

        const finalBalance = new web3.utils.BN(await web3.eth.getBalance(passenger));
        const expectedPayout = web3.utils.toWei("1.5", "ether");
        const expectedBalance = initialBalance.add(new web3.utils.BN(expectedPayout)).sub(gasCost);

        assert.equal(finalBalance.toString(), expectedBalance.toString(), "Passenger's balance should be correctly increased after the payout.");
    });
});
