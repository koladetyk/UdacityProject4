import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';

document.addEventListener('DOMContentLoaded', async () => {
    const contract = new Contract('localhost');
    try {
        const operationalStatus = await contract.isOperational();
        const statusElement = document.getElementById('operational-status-value');
        if (statusElement) {
            statusElement.textContent = operationalStatus ? "Operational" : "Not Operational";
            console.log("Operational status received:", operationalStatus);
        } else {
            console.error("Operational status element not found");
        }
    } catch (error) {
        console.error("Error while checking operational status:", error);
        alert("Failed to check operational status: " + error.message);
    }

    function addEventListeners() {
        const registerAirlineButton = document.getElementById('register-airline-btn');
        const fundAirlineButton = document.getElementById('fund-airline-btn');
        const registerFlightButton = document.getElementById('register-flight-btn');
        const buyInsuranceButton = document.getElementById('buy-insurance');
        const claimInsuranceButton = document.getElementById('claim-insurance');
        const submitOracleButton = document.getElementById('submit-oracle');

        registerAirlineButton.addEventListener('click', async () => {
            const airlineAddress = document.getElementById('airline-address-register').value;
            try {
                const result = await contract.registerAirline(airlineAddress);
                console.log("Airline registered successfully, transaction details:", result);
                alert("Airline registered successfully");
            } catch (error) {
                console.error("Error registering airline:", error);
                alert("Error registering airline: " + error.message);
            }
        });

        fundAirlineButton.addEventListener('click', async () => {
            const airlineAddress = document.getElementById('airline-address-fund').value;
            const amount = document.getElementById('fund-amount').value;
            try {
                await contract.fundAirline(airlineAddress, amount);
                console.log('Airline funded successfully');
                alert("Airline funded successfully");
            } catch (error) {
                console.error('Failed to fund airline:', error);
                alert("Failed to fund airline: " + error.message);
            }
        });

        registerFlightButton.addEventListener('click', async () => {
            const airline = document.getElementById('airline-address-flight').value;
            const flight = document.getElementById('flight-number').value;
            const timestamp = new Date(document.getElementById('flight-timestamp').value).getTime() / 1000;
            try {
                const result = await contract.registerFlight(airline, flight, timestamp);
                console.log("Flight registered successfully, transaction details:", result);
                alert("Flight registered successfully");
            } catch (error) {
                console.error("Error registering flight:", error);
                alert("Error registering flight: " + error.message);
            }
        });

        buyInsuranceButton.addEventListener('click', async () => {
            const airline = document.getElementById('insurance-airline-address').value;
            const flight = document.getElementById('insurance-flight').value;
            const timestamp = new Date(document.getElementById('insurance-timestamp').value).getTime() / 1000;
            const amount = document.getElementById('insurance-amount').value;
            try {
                await contract.buyInsurance(airline, flight, timestamp, amount);
                console.log('Insurance purchased successfully');
                alert("Insurance purchased successfully");
            } catch (error) {
                console.error('Failed to purchase insurance:', error);
                alert("Failed to purchase insurance: " + error.message);
            }
        });

        claimInsuranceButton.addEventListener('click', async () => {
            const airline = document.getElementById('claim-airline-address').value.trim();
            const flight = document.getElementById('claim-flight').value.trim();
            const timestampInput = document.getElementById('claim-timestamp').value;
            const timestamp = new Date(timestampInput).getTime() / 1000;
        
            // Only proceed if all fields are filled
            if (!airline & !flight & !timestampInput) {
                alert("Please fill all fields before submitting.");
                return; // Stop the function if any field is empty
            }
        
            try {
                await contract.claimInsurance(airline, flight, timestamp);
                console.log('Insurance claim processed successfully');
                alert("Insurance claim processed successfully");
            } catch (error) {
                console.error("Error claiming insurance:", error);
                alert("Error claiming insurance: " + error.message);
            }
        });
        
        

        submitOracleButton.addEventListener('click', async () => {
            const flight = document.getElementById('flight-number').value;
            try {
                // Note: Adding a callback function to handle the results and errors
                await contract.fetchFlightStatus(flight, (error, result) => {
                    if (error) {
                        console.error("Failed to fetch flight status", error);
                        alert("Error fetching flight status: " + error.message);
                    } else {
                        console.log("Flight status result:", result);
                        alert("Oracle submission complete");
                    }
                });
            } catch (error) {
                console.error("Error fetching flight status:", error);
                alert("Unhandled error: " + error.message);
            }
        });
        
    }

    addEventListeners();
});
