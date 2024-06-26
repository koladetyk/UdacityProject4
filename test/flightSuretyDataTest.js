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

    it('credits insurees correctly for delayed flights and ensures payouts are made correctly', async () => {
        const passenger = accounts[7];
        const airline = firstAirline;
        const flight = "ND1309";
        let timestamp = Math.floor(Date.now() / 1000);
        if (timestamp % 2 !== 0) {
            timestamp++; // Adjust timestamp to ensure it is even and thus triggers a delay
        }
        const insuranceAmount = web3.utils.toWei("1", "ether");
         
        // Passenger buys insurance
        await flightSuretyData.buy.sendTransaction(airline, flight, timestamp, { from: passenger, value: insuranceAmount });
        // Trigger credit for insurees
        await flightSuretyData.creditInsurees(airline, flight, timestamp, { from: owner });

        // Check if the passenger is credited before making a payout
        let creditedAmount = await flightSuretyData.getCreditedAmount(passenger);
        console.log(`Credited amount before payout: ${web3.utils.fromWei(creditedAmount.toString(), 'ether')}`);

        // Ensure the credited amount is not zero
        assert(creditedAmount.toString() !== '0', "Insuree should be credited before payout");

        // Payout
        const initialBalance = new web3.utils.BN(await web3.eth.getBalance(passenger));
        console.log(`initialBalance `+initialBalance);
        await flightSuretyData.pay.sendTransaction({ from: passenger });
        console.log(`got here `);

        // Verify if the payout was successful
        const finalBalance = new web3.utils.BN(await web3.eth.getBalance(passenger));
        const expectedPayout = new web3.utils.BN(creditedAmount);

        assert(finalBalance.sub(initialBalance).eq(expectedPayout), "Payout was not processed correctly");
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
