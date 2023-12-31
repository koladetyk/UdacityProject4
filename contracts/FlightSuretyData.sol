pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    struct Insurance {
        uint256 amount;
        address passenger;
        bool claimed;
    }
    mapping(bytes32 => Insurance) private flightInsurances;
    mapping(address => uint256) private creditedAmounts;
    mapping(address => uint256) private payouts;
    struct Airline {
        string name;
        bool funded;
    }

    mapping(address => bool) registeredAirlines;
    mapping(address => mapping(address => bool)) private votes;
    mapping(address => Airline) airlines;

    uint256 private registeredAirlinesCount; // keep track of the number of registered airlines

    struct AirlineVote {
        mapping(address => bool) voters;
        uint256 voteCount;
    }

    mapping(address => AirlineVote) private airlineVotes;

    mapping(address => bool) private authorizedCallers;

    mapping(bytes32 => uint8) flightStatuses;               //a mapping to store the flight status

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                ) 
                                public 
    {
        contractOwner = msg.sender;
    }

    event AirlineRegistered(address airline);
    event InsurancePurchased(address purchaser, address airline, string flight, uint256 timestamp, uint256 insuranceAmount);
    event InsuranceCredited(address passenger, address airline, string flight, uint256 timestamp, uint256 creditAmount);
    event PayoutMade(address recipient, uint256 payoutAmount);
    event AirlineFunded(address airline, uint256 fundingAmount);
    event CallerAuthorized(address caller);
    event FlightStatusUpdated(bytes32 flightKey, uint8 statusCode);


    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireAuthorizedCaller() {
        require(authorizedCallers[msg.sender], "Caller is not authorized");
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus
                            (
                                bool mode
                            ) 
                            external
                            requireContractOwner 
    {
        operational = mode;
    }

    function isFlightDelayed(address airline, string memory flight, uint256 timestamp) internal view returns (bool) {
        //let's assume the flight is delayed if the timestamp is even
        return (timestamp % 2 == 0);
    }

    function getVoteCount(address airlineAddress) internal view returns (uint256) {
        return airlineVotes[airlineAddress].voteCount;
    }

    function updateFlightStatus(address airline,string flight,uint256 timestamp,uint8 statusCode) external view{

        bytes32 flightKey = getFlightKey(airline, flight, timestamp);
        // Update the flight status
        flightStatuses[flightKey] = statusCode;

        // Emit event to notify the status update
        emit FlightStatusUpdated(flightKey, statusCode);
    }


        /********************************************************************************************/
    /*                                       TEST APP FUNCTIONS                                  */
    /********************************************************************************************/

    function authorizeCaller(address caller) external requireContractOwner {
        authorizedCallers[caller] = true;

        // Emit an event to indicate that the caller has been authorized
        emit CallerAuthorized(caller);
    }


    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline(address airlineAddress) external requireIsOperational() {
        // Check if the caller airline is registered
        require(registeredAirlines[msg.sender], "Airline is not registered");

        // Check if the number of registered airlines is less than four
        if (registeredAirlinesCount < 4) {
            registeredAirlines[airlineAddress] = true;
            registeredAirlinesCount++;
            emit AirlineRegistered(airlineAddress);
        }

        // Implement multi-party consensus logic
        require(!airlineVotes[airlineAddress].voters[msg.sender], "Airline has already voted");

        airlineVotes[airlineAddress].voters[msg.sender] = true;
        airlineVotes[airlineAddress].voteCount++;

        if (airlineVotes[airlineAddress].voteCount >= registeredAirlinesCount / 2) {
            registeredAirlines[airlineAddress] = true;
            registeredAirlinesCount++;
            emit AirlineRegistered(airlineAddress);
        }
    }


   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy(address airline, string flight, uint256 timestamp) external payable requireIsOperational() {
        // Calculate the insurance amount based on the value sent by the passenger
        uint256 insuranceAmount = msg.value;

        // Generate the flight key
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);

        // Create a new insurance object
        Insurance memory insurance = Insurance({
            amount: insuranceAmount,
            passenger: msg.sender,
            claimed: false
        });

        // Store the insurance details for the flight
        flightInsurances[flightKey] = insurance;

        // Emit an event to indicate that the insurance has been purchased
        emit InsurancePurchased(msg.sender, airline, flight, timestamp, insuranceAmount);
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees(address airline, string flight, uint256 timestamp) external payable requireIsOperational() {
        // Generate the flight key
        bytes32 flightKey = getFlightKey(airline, flight, timestamp);

        // Retrieve the insurance details for the flight
        Insurance storage insurance = flightInsurances[flightKey];

        // Check if the flight is delayed due to airline fault
        if (isFlightDelayed(airline, flight, timestamp)) {
            // Calculate the credit amount (1.5 times the insurance amount)
            uint256 creditAmount = insurance.amount.mul(3).div(2);

            // Credit the insurance amount to the passenger
            creditedAmounts[insurance.passenger] = creditedAmounts[insurance.passenger].add(creditAmount);

            // Mark the insurance as claimed
            insurance.claimed = true;

            // Emit an event to indicate that the insurance has been credited
            emit InsuranceCredited(insurance.passenger, airline, flight, timestamp, creditAmount);
        }
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay() external {
        // Get the payout amount for the caller (insured passenger)
        uint256 payoutAmount = payouts[msg.sender];

        // Ensure that the payout amount is greater than zero
        require(payoutAmount > 0, "No payout available for the caller");

        // Reset the payout amount for the caller
        payouts[msg.sender] = 0;

        // Transfer the payout amount to the insured passenger
        msg.sender.transfer(payoutAmount);

        // Emit an event to indicate that the payout has been made
        emit PayoutMade(msg.sender, payoutAmount);
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund() public payable {
        // Require a non-zero amount of funds to be sent
        require(msg.value > 0, "No funds sent with the transaction");

        // Update the airline's funding status
        airlines[msg.sender].funded = true;

        // Emit an event to indicate that the airline has funded the contract
        emit AirlineFunded(msg.sender, msg.value);
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
                            external 
                            payable 
    {
        fund();
    }
}

