// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/ccip/libraries/Client.sol";
import "@chainlink/contracts/src/v0.8/ccip/applications/CCIPReceiver.sol";

/**
 * @title MockCCIPRouter
 * @notice Mock implementation of a CCIP Router for testing purposes
 */
contract MockCCIPRouter {
    // Events to capture test information
    event CCIPReceived(address indexed receiver, Client.Any2EVMMessage message);

    // Store events for testing
    struct EventRecord {
        string eventName;
        mapping(string => bytes) args;
        string[] argNames;
    }

    EventRecord[] private events;

    // Function to simulate CCIP receive
    function simulateCcipReceive(address receiver, Client.Any2EVMMessage memory message) external {
        emit CCIPReceived(receiver, message);

        // Call the ccipReceive function on the target contract
        CCIPReceiver(receiver).ccipReceive(message);
    }

    // Functions for test assertions
    function recordEvent(string memory eventName) external {
        uint256 index = events.length;
        events.push();
        events[index].eventName = eventName;
    }

    function addEventArg(string memory argName, bytes memory argValue) external {
        require(events.length > 0, "No events recorded");
        uint256 lastIndex = events.length - 1;
        events[lastIndex].args[argName] = argValue;
        events[lastIndex].argNames.push(argName);
    }

    // Function to check events for tests
    function getEmittedEvents() external view returns (EventInfo[] memory eventInfos) {
        eventInfos = new EventInfo[](events.length);

        for (uint256 i = 0; i < events.length; i++) {
            eventInfos[i].eventName = events[i].eventName;

            ArgInfo[] memory args = new ArgInfo[](events[i].argNames.length);
            for (uint256 j = 0; j < events[i].argNames.length; j++) {
                args[j].name = events[i].argNames[j];
                args[j].value = events[i].args[events[i].argNames[j]];
            }

            eventInfos[i].args = args;
        }

        return eventInfos;
    }

    struct EventInfo {
        string eventName;
        ArgInfo[] args;
    }

    struct ArgInfo {
        string name;
        bytes value;
    }
}
