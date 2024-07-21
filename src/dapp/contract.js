import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback = () => {}) {
        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
            if (error) {
                console.error("Error fetching accounts", error);
                return;  // Early exit on error
            }

            this.owner = accts[0];
            let counter = 1;

            while (this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while (this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            if (typeof callback === 'function') {
                callback();
            } else {
                console.error('Provided callback is not a function');
            }
        });
    }

    async fundAirline(airlineAddress, amount) {
        let valueWei = this.web3.utils.toWei(amount.toString(), "ether");
        try {
            const result = await this.flightSuretyApp.methods.fundAirline()
                .send({ from: airlineAddress, value: valueWei, gas: 4712388, gasPrice: 100000000000 });
            console.log("Airline funded successfully:", result);
            return result;
        } catch (error) {
            console.error("Failed to fund airline:", error);
            throw error;
        }
    }

    isOperational(callback = () => {}) {
        console.log("Checking if the contract is operational...");
        this.flightSuretyApp.methods.isOperational()
            .call({ from: this.owner }, (error, result) => {
                if (error) {
                    console.error("Error in isOperational call", error);
                } else {
                    console.log("Operational Status:", result);
                }
                if (typeof callback === 'function') {
                    callback(error, result);
                } else {
                    console.error('Callback provided is not a function');
                }
            });
    }

    async authorizeCaller(userAddress) {
        try {
            const result = await this.flightSuretyApp.methods.authorizeCaller(userAddress).send({ from: this.owner });
            console.log("User authorized:", result);
        } catch (error) {
            console.error("Error authorizing user:", error);
        }
    }
    
    fetchFlightStatus(flight, callback) {
        let payload = {
            airline: this.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        };
        console.log("Fetching flight status for:", payload);
        this.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: this.owner }, (error, result) => {
                if (error) {
                    console.error("Error fetching flight status", error);
                } else {
                    console.log("Flight Status fetched:", result);
                }
                callback(error, payload);
            });
    }

    async registerAirline(airlineAddress) {
        try {
            const result = await this.flightSuretyApp.methods.registerAirline(airlineAddress)
                .send({ from: this.owner });
            console.log("Airline registered:", result);
            return result;
        } catch (error) {
            console.error("Error registering airline:", error);
            throw error;
        }
    }

    async registerFlight(airline, flight, timestamp) {
        try {
            const result = await this.flightSuretyApp.methods.registerFlight(airline, flight, timestamp)
                .send({ from: this.owner });
            console.log("Flight registered:", result);
            return result;
        } catch (error) {
            console.error("Error registering flight:", error);
            throw error;
        }
    }

    async buyInsurance(airline, flight, timestamp, amount) {
        let valueWei = this.web3.utils.toWei(amount.toString(), "ether");
        try {
            const result = await this.flightSuretyApp.methods.buy(airline, flight, timestamp)
                .send({ from: this.owner, value: valueWei, gas: 4712388, gasPrice: 100000000000 });
            console.log("Insurance purchased:", result);
            return result;
        } catch (error) {
            console.error("Error buying insurance:", error);
            throw error;
        }
    }

    async claimInsurance(airline, flight, timestamp) {
        try {
            const result = await this.flightSuretyApp.methods.creditInsurees(airline, flight, timestamp)
                .send({ from: this.owner, gas: 4712388, gasPrice: 100000000000 });
            console.log("Insurance claimed:", result);
            return result;
        } catch (error) {
            console.error("Error claiming insurance:", error);
            throw error;
        }
    }

    async checkFlightStatus(flightKey) {
        try {
            const status = await this.flightSuretyApp.methods.checkFlightStatus(flightKey)
                .call();
            console.log("Flight status checked:", status);
            return status;
        } catch (error) {
            console.error("Error checking flight status:", error);
            throw error;
        }
    }
}
