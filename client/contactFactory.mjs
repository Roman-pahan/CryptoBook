import { ethers } from "ethers";
import getProvider from "/provider.mjs";

const address = "0xB0DC2fda02B17Dbf245fee1dC8a33c369dCe49FA";
const ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "contracts",
    outputs: [
      {
        internalType: "contract CryptoBook",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_telegram",
        type: "string",
      },
    ],
    name: "createContact",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_telegram",
        type: "string",
      },
      {
        internalType: "string",
        name: "_discord",
        type: "string",
      },
    ],
    name: "createContact",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const EthABI = [
  "function contracts (address) public view returns (address)",
  "function createContact(string, string ) public",
  "function createContact(string) public",
];

const contactFactory = new ethers.Contract(address, EthABI, getProvider());

export default contactFactory;
