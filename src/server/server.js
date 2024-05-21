import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);

// Simulated Oracles
const oracles = [];

// Initialize or simulate oracles
function initializeOracles() {
    const ORACLES_COUNT = 20; // Define how many oracles you want to simulate
    const accounts = await web3.eth.getAccounts();
    const fee = await flightSuretyApp.methods.REGISTRATION_FEE().call();
    for (let i = 1; i <= ORACLES_COUNT; i++) {
        let account = accounts[i]; // Assuming account[0] is the owner
        await flightSuretyApp.methods.registerOracle().send({from: account, value: fee, gas: 3000000});
        let indexes = await flightSuretyApp.methods.getMyIndexes().call({from: account});
        oracles.push({ address: account, indexes });
    }
}

// Call this function at server start
initializeOracles();

// Event listener for OracleRequest
flightSuretyApp.events.OracleRequest({
    fromBlock: 'latest'
}, async (error, event) => {
    if (error) console.log(error);
    console.log("Oracle Request Event Received:", event);

    const { index, airline, flight, timestamp } = event.returnValues;

    const suitableOracles = oracles.filter(oracle => oracle.indexes.includes(index));
    suitableOracles.forEach(oracle => {
        try {
            const statusCode = getRandomStatusCode(); 
            await flightSuretyApp.methods.submitOracleResponse(index, airline, flight, timestamp, statusCode)
                .send({ from: oracle.address, gas: 3000000 });
            console.log(`Oracle response submitted by ${oracle.address}`);
        } catch (error) {
            console.error(`Error submitting oracle response: ${error.message}`);
        }
    });
});

function getRandomStatusCode() {
    return [10, 20, 30, 40, 50][Math.floor(Math.random() * 5)];
}

const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    });
});

export default app;
