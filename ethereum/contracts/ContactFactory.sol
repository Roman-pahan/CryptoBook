// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { CryptoBook } from "./CryptoBook.sol";

contract ContactFactory{
    mapping (address => CryptoBook) public contracts;

    modifier isBusy() {
        // типобезопасное сравнение (можно и address(...)==address(0))
        require(contracts[msg.sender] == CryptoBook(address(0)), "You already have a contact!");
        _;
    }

    function createContact(string memory _telegram, string memory _discord) public isBusy {
        CryptoBook contact = new CryptoBook(msg.sender, _telegram, _discord);
        contracts[msg.sender] = contact;
    }

    function createContact(string memory _telegram) public isBusy {
        CryptoBook contact = new CryptoBook(msg.sender, _telegram, "");
        contracts[msg.sender] = contact;
    }
}