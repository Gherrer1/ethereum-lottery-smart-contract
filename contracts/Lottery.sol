pragma solidity ^0.4.17;

contract Lottery {
    address public manager;
    address[] public players;

    function Lottery() public {
        manager = msg.sender;
    }

    function getNumPlayers() public view returns (uint) {
        return players.length;
    }

    function enter() public payable {
        // in wei
        if(msg.value >= 1) {
            players.push(msg.sender);
        }
    }
}