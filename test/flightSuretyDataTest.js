const FlightSuretyData = artifacts.require('FlightSuretyData');

contract('FlightSuretyData', (accounts) => {
    let flightSuretyData;
    const owner = accounts[0]; 
    const firstAirline = accounts[1];
    const secondAirline = accounts[2];
    const thirdAirline = accounts[4];  
    const fourthAirline = accounts[5];
    const fifthAirline = accounts[6];
    //const passenger = accounts[3];  // Define passenger here if used in multiple tests

    before(async () => {
        //flightSuretyData = await FlightSuretyData.deployed();
        //let tx = await flightSuretyData.registerAirline(firstAirline, { from: owner });
        flightSuretyData = await FlightSuretyData.deployed();
        await flightSuretyData.registerAirline(firstAirline, { from: owner });
        //console.log(`Transaction hash: ${tx.tx}`);
        //console.log(`Transaction hash for first airline registration: ${tx.tx}`);
        //const nonce = await web3.eth.getTransactionCount(owner, "latest");
        //console.log(`Current nonce for owner is: ${nonce}`);

    });

    async function confirmTransaction(txHash) {
        let receipt = null;
        while (receipt === null) { // Check for receipt until it's available
            receipt = await web3.eth.getTransactionReceipt(txHash);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
        }
    }

    it('is deployed correctly and the contract address is logged', async () => {
       // console.log(flightSuretyData.address); // Log the contract address
        console.log(`FlightSuretyData contract address: ${flightSuretyData.address}`);
        assert(flightSuretyData.address, "FlightSuretyData contract should be deployed");
        const nonce = await web3.eth.getTransactionCount(owner, "latest");
        console.log(`Current nonce for owner is: ${nonce}`);
    });

    it('verifies that the first airline is registered', async () => {
        let isRegistered = await flightSuretyData.isAirlineRegistered(firstAirline);
        console.log(`First airline registered status: ${isRegistered}`);
        assert.equal(isRegistered, true, "First airline should be registered.");
        const nonce = await web3.eth.getTransactionCount(owner, "latest");
        console.log(`Current nonce for owner is: ${nonce}`);
    });

    it('has correct initial isOperational status', async () => {
        let status = await flightSuretyData.isOperational.call();
        console.log(`Initial operational status: ${status}`);
        assert.equal(status, true, "Incorrect initial operational status value expected true");
        const nonce = await web3.eth.getTransactionCount(owner, "latest");
        console.log(`Current nonce for owner is: ${nonce}`);
    });

    it('can block access to setOperatingStatus() for non-Contract Owner account', async () => {
        try {
            await flightSuretyData.setOperatingStatus(false, { from: accounts[1] });
            assert.fail("Access not restricted to Contract Owner");
        } catch (error) {
            console.log(`Access control test passed: ${error.message}`);
            assert(error, "Expected an error but did not get one");
            const nonce = await web3.eth.getTransactionCount(owner, "latest");
            console.log(`Current nonce for owner is: ${nonce}`);
        }
    });

    //it("allows registration of another airline by the first airline", async () => {
    //    console.log("Attempting to register second airline...");
    //    let tx = await flightSuretyData.registerAirline(secondAirline, { from: firstAirline });
    //    console.log(`Transaction hash for registering second airline: ${tx.tx}`);
    //    
        // Ensure transaction has been processed
    //    let receipt = await web3.eth.getTransactionReceipt(tx.tx);
    //    while (receipt === null) {
    //        receipt = await web3.eth.getTransactionReceipt(tx.tx);
    //    }

    //    let isRegistered = await flightSuretyData.isAirlineRegistered(secondAirline);
    //    console.log(`Second airline registered: ${isRegistered}`);
    //    assert.equal(isRegistered, true, "Second airline should be registered by the first airline");
    //});

    it("allows registration of another airline by the first airline", async () => {
        const isAlreadyRegistered = await flightSuretyData.isAirlineRegistered(fourthAirline);
        console.log("is already reg "+ isAlreadyRegistered );
        if (!isAlreadyRegistered) {
            const tx = await flightSuretyData.registerAirline(fourthAirline, { from: firstAirline });
            await confirmTransaction(tx.tx);
            console.log(`Transaction hash for registering second airline: ${tx.tx}`);
        } else {
            console.log(`Second airline already registered, skipping registration.`);
        }
    
        const isRegistered = await flightSuretyData.isAirlineRegistered(fourthAirline);
        assert.equal(isRegistered, true, "Second airline should be registered by the first airline");
    });
    
    

    // Implement tests for buying insurance, crediting insurees, and making payouts
    it('allows a user to buy insurance for a flight', async () => {
        const passenger = accounts[3];
        const flight = "ND1309"; 
        const timestamp = Math.floor(Date.now() / 1000); 
        const insuranceAmount = web3.utils.toWei("0.1", "ether"); 

        let tx = await flightSuretyData.buy(firstAirline, flight, timestamp, {from: passenger, value: insuranceAmount});
        console.log(`Insurance purchased transaction hash: ${tx.tx}`);
    });

    it('credits insurees correctly for delayed flights', async () => {
        const passenger = accounts[7];
        const airline = firstAirline;
        const flight = "ND1309";
        const timestamp = Math.floor(Date.now() / 1000); // This should match your flight delay check
        const insuranceAmount = web3.utils.toWei("1", "ether");
    
        // Ensure passenger buys insurance
        await flightSuretyData.buy(airline, flight, timestamp, { from: passenger, value: insuranceAmount });
        console.log("Insurance bought for passenger:", passenger);
    
        // Triggering credit insurees
        await flightSuretyData.creditInsurees(airline, flight, timestamp, { from: owner });
        console.log("Credit insurees called for flight:", flight);
    
        // Retrieve credited amount to verify if the operation was successful
        const creditedAmount = await flightSuretyData.creditedAmounts(passenger);
        console.log("Credited amount for passenger:", creditedAmount.toString());
    
        const expectedCredit = web3.utils.toWei("1.5", "ether");
        assert.equal(creditedAmount.toString(), expectedCredit.toString(), "The credited amount is incorrect or not set.");
    });
    
    it('ensures that payouts are made correctly', async () => {
        const passenger = accounts[7]; // Using the same passenger
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
