# EscrowContract Documentation

## Overview

The `EscrowContract` is a Solidity smart contract that facilitates a simple escrow service between a buyer, a seller, and an arbitrator. It supports transactions involving ERC-20 tokens and provides a workflow for the exchange of goods or services.

## Contract Details

### State Variables

- `seller`: Address of the seller.
- `buyer`: Address of the buyer.
- `arbitrator`: Address of the arbitrator.
- `price`: The agreed-upon price for the transaction.
- `token`: Instance of the ERC-20 token contract.
- `status`: Enum variable representing the current state of the escrow contract.

### Enumerated Status

The `Status` enumeration represents the various stages the escrow contract can be in:

- `Created`: Contract initialized.
- `Paid`: Buyer has paid.
- `Delivered`: Seller has delivered.
- `Completed`: Transaction completed.
- `Disputed`: Dispute initiated.
- `Resolved`: Dispute resolved.

### Events

- `Paid`: Triggered when the buyer makes a payment.
- `Delivered`: Triggered when the seller marks the goods or services as delivered.
- `Completed`: Triggered when the buyer confirms the completion of the transaction.
- `Disputed`: Triggered when the buyer initiates a dispute.
- `Resolved`: Triggered when the arbitrator resolves a dispute.

### Modifiers

- `onlyBuyer`: Ensures that only the buyer can execute a function.
- `onlySeller`: Ensures that only the seller can execute a function.
- `onlyArbitrator`: Ensures that only the arbitrator can execute a function.
- `inStatus(Status _status)`: Ensures that a function is called in a specific contract status.

## Constructor

The contract is initialized with the following parameters:

- `_buyer`: Address of the buyer.
- `_arbitrator`: Address of the arbitrator.
- `_price`: The agreed-upon price.
- `_tokenAddress`: Address of the ERC-20 token contract.

## Core Functions

### `pay()`

Allows the buyer to make a payment, updating the contract status to `Paid`.

### `deliver()`

Allows the seller to mark the goods or services as delivered, updating the contract status to `Delivered`.

### `complete()`

Allows the buyer to confirm the completion of the transaction, releasing the funds to the seller.

### `dispute()`

Allows the buyer to initiate a dispute, updating the contract status to `Disputed`.

### `resolveDispute(bool resolution)`

Allows the arbitrator to resolve a dispute. If `resolution` is true, funds are returned to the buyer; otherwise, funds go to the seller.

## Usage

1. Deploy the contract, providing the buyer, arbitrator, price, and ERC-20 token contract address.
2. Buyer calls `pay()` to make a payment.
3. Seller calls `deliver()` to confirm delivery.
4. Buyer calls `complete()` to release funds to the seller.
5. If a dispute arises, the buyer calls `dispute()`, and the arbitrator can then call `resolveDispute()`.

Note: The contract does not accept Ether directly; all transactions must be in ERC-20 tokens.

# Running a Project Using npm

## 1. Install Dependencies

Before starting to work with the project, make sure you have [Node.js](https://nodejs.org/) and [npm (Node Package Manager)](https://www.npmjs.com/) installed.

## 2. Clone the Project

Clone the project from the repository and navigate to the project directory in the terminal:

```bash
git clone https://github.com/pawell24/EscrowContract.git
cd EscrowContract
```

## 3. Install npm Dependencies

Execute the following command to install all project dependencies defined in the package.json file:

```bash
npm install
```

## 4. Deploying the Contract and Running Tests

If you have scripts defined in the package.json file, you can use them to deploy the contract and run tests.

- `npm run deploy`: Deploy the contract on a specified network.
- `npm test`: Run tests.
- `npm run coverage`: Check code coverage with tests.

Replace `NETWORK_NAME` with the Ethereum network name where you want to deploy the contract.
