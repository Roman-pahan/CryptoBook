// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;


contract CryptoBook{
    address public owner;
    string public telegram;
    string public discord;
    string public desc;

    constructor(address _owner, string memory _telegram, string memory _discord){
        owner = _owner;          // ← оставляем владельцем пользователя
        telegram = _telegram;
        discord = _discord;
        // owner = msg.sender;    // ← УДАЛИТЬ, иначе владельцем станет фабрика
    }

    modifier onlyOwner(){
        require(owner == msg.sender, "You are not an owner!");
        _;
    }

    function setTelegram (string memory _telegram) public onlyOwner {
        telegram = _telegram;
    }

    function setDiscord (string memory _discord) public onlyOwner {
        discord = _discord;
    }

    function setDesc (string memory _desc) public onlyOwner {
        desc = _desc;
    }
}