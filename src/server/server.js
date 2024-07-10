import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

const config = Config['localhost'];
const web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));

let flightSuretyApp;
const oracles = [];

web3.eth.getAccounts()
    .then(accounts => {
        console.log(accounts); // Log to see all accounts
        web3.eth.defaultAccount = accounts[0];
        console.log(web3.eth.defaultAccount); // Check if default account is set

        flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        initializeOracles(); // Initialize oracles after setting default account
    })
    .catch(error => {
        console.error("Error fetching accounts", error);
    });

async function initializeOracles() {
    const ORACLES_COUNT = 20; // This might be too high if your testnet has fewer accounts
    const accounts = await web3.eth.getAccounts();
    
    // Adjusting the count based on available accounts
    const actualCount = Math.min(ORACLES_COUNT, accounts.length);

    const fee = await flightSuretyApp.methods.REGISTRATION_FEE().call();
    for (let i = 0; i < actualCount; i++) {
        let account = accounts[i]; // Ensure this doesn't exceed accounts length
        try {
            await flightSuretyApp.methods.registerOracle().send({from: account, value: fee, gas: 3000000});
            let indexes = await flightSuretyApp.methods.getMyIndexes().call({from: account});
            oracles.push({ address: account, indexes });
        } catch (error) {
            console.error(`Error registering oracle for account ${account}:`, error);
        }
    }
}


// Set up your express application and routes as usual
const app = express();
app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    });
});

app.listen(3002, () => console.log('Server running on port 3001'));

export default app;
