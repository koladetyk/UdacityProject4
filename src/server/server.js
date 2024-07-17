// Existing imports and setup...
import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

const config = Config['localhost'];
const web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
const oracles = [];

// Initialize Oracles and register them
async function initializeOracles() {
    const ORACLES_COUNT = 20; // Adjust based on your environment
    const accounts = await web3.eth.getAccounts();
    const actualCount = Math.min(ORACLES_COUNT, accounts.length);
    const fee = await flightSuretyApp.methods.REGISTRATION_FEE().call();

    for (let i = 1; i < actualCount; i++) {
        try {
            await flightSuretyApp.methods.registerOracle().send({from: accounts[i], value: fee, gas: 3000000});
            let indexes = await flightSuretyApp.methods.getMyIndexes().call({from: accounts[i]});
            oracles.push({ address: accounts[i], indexes });
            console.log(`Oracle Registered: ${accounts[i]} with indexes ${indexes.join(", ")}`);
        } catch (error) {
            console.error(`Error registering oracle for account ${accounts[i]}:`, error);
        }
    }
}

// Handle OracleRequest events
flightSuretyApp.events.OracleRequest({
    fromBlock: "latest"
}, function (error, event) {
    if (error) console.log(error);

    let index = event.returnValues.index;
    let airline = event.returnValues.airline;
    let flight = event.returnValues.flight;
    let timestamp = event.returnValues.timestamp;

    // Loop through all registered oracles, check if they can respond
    oracles.forEach((oracle) => {
        if (oracle.indexes.includes(index)) {
            // If oracle has a matching index, submit a response
            submitOracleResponse(index, airline, flight, timestamp, oracle.address);
        }
    });
});

// Function to submit Oracle Responses
function submitOracleResponse(index, airline, flight, timestamp, oracleAddress) {
    let statusCode = getRandomStatusCode(); // Implement this function based on your logic
    flightSuretyApp.methods.submitOracleResponse(index, airline, flight, timestamp, statusCode)
        .send({ from: oracleAddress, gas: 3000000 })
        .then(() => console.log(`Submitted oracle response: Status Code ${statusCode} by ${oracleAddress}`))
        .catch(err => console.error('Error submitting oracle response:', err));
}

// Express app setup...
const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    });
});
//app.listen(3003, () => console.log('Server running on port 3003'))

export default app;
