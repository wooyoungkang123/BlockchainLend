export const CCIPInterfaceABI = [
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "destinationChainSelector",
        "type": "uint64"
      },
      {
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      },
      {
        "internalType": "uint256",
        "name": "gasLimit",
        "type": "uint256"
      }
    ],
    "name": "sendMessageToChain",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "messageId",
        "type": "bytes32"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "messageId",
        "type": "bytes32"
      }
    ],
    "name": "getMessageStatus",
    "outputs": [
      {
        "internalType": "uint8",
        "name": "status",
        "type": "uint8"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const; 