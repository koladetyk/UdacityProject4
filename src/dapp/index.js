import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';

document.addEventListener('DOMContentLoaded', async () => {
    const contract = new Contract('localhost');
    try {
        console.log("Checking operational status...");
        const operationalStatus = await contract.isOperational((error, result) => {
            if (error) {
                console.error("Error while checking operational status:", error);
                return;
            }
            console.log("Operational status received:", result); // Ensure this logs 'true'
            const statusElement = document.getElementById('operational-status-value');
            if (statusElement) {
                statusElement.textContent = result ? "Operational" : "Not Operational";
                console.log("Status element updated to:", statusElement.textContent); // Check what is being set
            } else {
                console.error("Operational status element not found");
            }
        });
    } catch (error) {
        console.error("Error while checking operational status:", error);
    }

    function addEventListeners() {

        document.getElementById('register-airline-btn').addEventListener('click', async () => {
            let airlineAddress = document.getElementById('airline-address-register').value;
            console.log("Attempting to register airline with address:", airlineAddress);
            try {
                const result = await contract.registerAirline(airlineAddress);
                console.log("Airline registered successfully, transaction details:", result);
            } catch (error) {
                console.error("Error registering airline:", error);
            }
        });

        document.getElementById('fund-airline-btn').addEventListener('click', async () => {
            const airlineAddress = document.getElementById('airline-address-fund').value;
            const amount = document.getElementById('fund-amount').value;

            console.log(`Funding airline with address: ${airlineAddress} and amount: ${amount}`);

            try {
                await contract.fundAirline(airlineAddress, amount);
                console.log('Airline funded successfully');
            } catch (error) {
                console.error('Failed to fund airline:', error);
            }
        });
        

        document.getElementById('register-airline-fund').addEventListener('click', async () => {
            const airlineAddress = document.getElementById('airline-address-fund').value;
            const amount = document.getElementById('fund-amount').value;

            console.log(`Funding airline with address: ${airlineAddress} and amount: ${amount}`);

            try {
                await contract.fundAirline(airlineAddress, amount);
                console.log('Airline funded successfully');
            } catch (error) {
                console.error('Failed to fund airline:', error);
            }
        });
        const submitOracleBtn = document.getElementById('submit-oracle');
        const registerAirlineBtn = document.getElementById('register-airline');
        if (registerAirlineBtn) {
            registerAirlineBtn.addEventListener('click', async () => {
                let airlineAddress = document.getElementById('airline-address-register').value;
                console.log("Attempting to register airline with address:", airlineAddress);
                try {
                    const result = await contract.registerAirline(airlineAddress);
                    console.log("Airline registered successfully, transaction details:", result);
                } catch (error) {
                    console.error("Error registering airline:", error);
                }
            });
        } else {
            console.error("Register Airline button not found");
        }

        const buyInsuranceBtn = document.getElementById('buy-insurance');
        buyInsuranceBtn.addEventListener('click', async () => {
            const airline = document.getElementById('insurance-airline-address').value;
            const flight = document.getElementById('insurance-flight').value;
            const timestamp = new Date(document.getElementById('insurance-timestamp').value).getTime() / 1000;
            const amount = document.getElementById('insurance-amount').value;
        
            try {
                await contract.buyInsurance(airline, flight, timestamp, {value: web3.utils.toWei(amount, 'ether')});
                console.log('Insurance purchased successfully');
            } catch (error) {
                console.error('Failed to purchase insurance:', error);
            }
        });

        const claimInsuranceBtn = document.getElementById('claim-insurance');
        claimInsuranceBtn.addEventListener('click', async () => {
            let airline = document.getElementById('claim-airline-address').value;
            let flight = document.getElementById('claim-flight').value;
            let timestamp = new Date(document.getElementById('claim-timestamp').value).getTime() / 1000;
            try {
                await contract.claimInsurance(airline, flight, timestamp);
                console.log('Insurance claim processed successfully');
            } catch (error) {
                console.error("Error claiming insurance:", error);
            }
        });

        const registerFlightBtn = document.getElementById('register-flight-btn');
        if (registerFlightBtn) {
            registerFlightBtn.addEventListener('click', async () => {
                const airline = document.getElementById('airline-address-flight').value;
                const flight = document.getElementById('flight-number').value;
                const timestamp = new Date(document.getElementById('flight-timestamp').value).getTime() / 1000;
                console.log(`Attempting to register flight with airline: ${airline}, flight number: ${flight}, timestamp: ${timestamp}`);
                try {
                    const result = await contract.registerFlight(airline, flight, timestamp);
                    console.log("Flight registered successfully, transaction details:", result);
                } catch (error) {
                    console.error("Error registering flight:", error);
                }
            });
        } else {
            console.error("Register Flight button not found in the DOM.");
        }

        document.getElementById('register-flight-btn').addEventListener('click', async () => {
            const airline = document.getElementById('airline-address-flight').value;
            const flight = document.getElementById('flight-number').value;
            const datetime = document.getElementById('flight-timestamp').value;
            const timestamp = new Date(datetime).getTime() / 1000; // Converts to UNIX timestamp
        
            console.log(`Registering flight with details: Airline: ${airline}, Flight: ${flight}, Timestamp: ${timestamp}`);
        
            try {
                const result = await contract.registerFlight(airline, flight, timestamp);
                console.log("Flight registered successfully:", result);
            } catch (error) {
                console.error("Error registering flight:", error);
            }
        });
        

        submitOracleBtn.addEventListener('click', async () => {
            let flight = document.getElementById('flight-number').value;
            console.log("Submitting oracle for flight:", flight);
            try {
                await contract.fetchFlightStatus(flight);
            } catch (error) {
                console.error("Error fetching flight status:", error);
            }
        });

        document.getElementById('authorize-user').addEventListener('click', async () => {
            const userAddress = document.getElementById('user-address').value;
            console.log("Authorizing user:", userAddress);
            try {
                await contract.authorizeCaller(userAddress);
            } catch (error) {
                console.error("Failed to authorize user:", error);
            }
        });
    }

    // Call to setup event listeners
    addEventListeners();
});
