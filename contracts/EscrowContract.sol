// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract EscrowContract {
    address public seller;
    address public buyer;
    address public arbitrator;

    uint256 public price;
    IERC20 public token;

    enum Status {
        Created,
        Paid,
        Delivered,
        Completed,
        Disputed,
        Resolved
    }

    Status public status;

    event Paid(address indexed buyer, uint256 amount);
    event Delivered();
    event Completed();
    event Disputed();
    event Resolved(address indexed arbitrator, Status resolution);

    modifier onlyBuyer() {
        require(msg.sender == buyer, "You are not the buyer");
        _;
    }

    modifier onlySeller() {
        require(msg.sender == seller, "You are not the seller");
        _;
    }

    modifier onlyArbitrator() {
        require(msg.sender == arbitrator, "You are not the arbitrator");
        _;
    }

    modifier inStatus(Status _status) {
        require(status == _status, "Invalid status");
        _;
    }

    constructor(
        address _buyer,
        address _arbitrator,
        uint256 _price,
        address _tokenAddress
    ) {
        seller = msg.sender;
        buyer = _buyer;
        arbitrator = _arbitrator;
        price = _price;
        token = IERC20(_tokenAddress);
        status = Status.Created;
    }

    function pay() external onlyBuyer inStatus(Status.Created) {
        require(
            token.transferFrom(buyer, address(this), price),
            "Token transfer failed"
        );
        status = Status.Paid;
        emit Paid(buyer, price);
    }

    function deliver() external onlySeller inStatus(Status.Paid) {
        status = Status.Delivered;
        emit Delivered();
    }

    function complete() external onlyBuyer inStatus(Status.Delivered) {
        require(token.transfer(seller, price), "Token transfer failed");
        status = Status.Completed;
        emit Completed();
    }

    function dispute() external onlyBuyer inStatus(Status.Paid) {
        status = Status.Disputed;
        emit Disputed();
    }

    function resolveDispute(bool resolution)
        external
        onlyArbitrator
        inStatus(Status.Disputed)
    {
        if (resolution) {
            require(token.transfer(buyer, price), "Token transfer failed");
            status = Status.Resolved;
        } else {
            require(token.transfer(seller, price), "Token transfer failed");
            status = Status.Paid;
        }
        emit Resolved(arbitrator, status);
    }

    // Fallback function to reject incoming ETH
    receive() external payable {
        revert("This contract does not accept ETH directly");
    }
}
