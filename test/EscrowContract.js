const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('EscrowContract', () => {
  // Declare variables for contract instances and addresses
  let ERC20Mock,
    buyer,
    arbitrator,
    escrowContract,
    token,
    tokenAddress,
    escrowContractAddress,
    buyerAddress,
    sellerAddress

  // Function to deploy contracts and set up initial state
  async function deployContracts() {
    ERC20Mock = await ethers.getContractFactory('ERC20Mock')
    token = await ERC20Mock.deploy('TEST TOKEN', 'TST')
    tokenAddress = await token.getAddress()
    ;[buyer, arbitrator] = await ethers.getSigners()

    const EscrowContract = await ethers.getContractFactory('EscrowContract')
    escrowContract = await EscrowContract.deploy(
      buyer.address,
      arbitrator.address,
      1000000,
      tokenAddress
    )

    escrowContractAddress = await escrowContract.getAddress()
    buyerAddress = await buyer.getAddress()
  }

  // Run this function before each test to ensure a clean state
  beforeEach(async () => {
    await deployContracts()
  })

  // Test suite for contract initialization
  describe('Initialization', () => {
    it('should initialize the contract correctly', async function () {
      // Test initialization parameters
      const contractBuyer = await escrowContract.buyer()
      const contractArbitrator = await escrowContract.arbitrator()
      const contractPrice = await escrowContract.price()
      const contractToken = await escrowContract.token()
      const contractStatus = await escrowContract.status()

      // Check if contract parameters are set correctly
      expect(contractBuyer).to.equal(buyer.address, 'Buyer address is incorrect')
      expect(contractArbitrator).to.equal(arbitrator.address, 'Arbitrator address is incorrect')
      expect(contractPrice).to.equal(1000000, 'Price is incorrect')
      expect(contractToken).to.equal(tokenAddress, 'Token address is incorrect')
      expect(contractStatus).to.equal(0, 'Status should be Created')
    })
  })

  // Test suite for payment process
  describe('Payment Process', () => {
    it('should transition to Paid status after successful payment', async () => {
      // Transfer tokens to the buyer's address
      await token.transfer(buyerAddress, 1000000)

      // Approve the contract to spend tokens on behalf of the buyer
      await token.connect(buyer).approve(escrowContractAddress, 1000000)

      // Make a payment from the buyer's address
      await escrowContract.connect(buyer).pay()

      // Check if status transitions to Paid
      const contractStatus = await escrowContract.status()
      expect(contractStatus).to.equal(1, 'Status should be Paid')
    })

    it('should not allow payment in Disputed status', async () => {
      // Make a payment
      await token.transfer(buyerAddress, 1000000)
      await token.connect(buyer).approve(escrowContractAddress, 1000000)
      await escrowContract.connect(buyer).pay()

      // Initiate a dispute
      await escrowContract.connect(buyer).dispute()

      // Try to make another payment (should fail)
      await expect(escrowContract.connect(buyer).pay()).to.be.revertedWith('Invalid status')
    })

    it('should reject incoming ETH and revert with the expected error message', async () => {
      // Try to send ETH to the contract (you can adjust the value as needed)
      const sendEtherTransaction = async () => {
        return buyer.sendTransaction({
          to: escrowContractAddress,
          value: 10000,
        })
      }
      // Check if the transaction reverts with the expected error message
      await expect(sendEtherTransaction()).to.be.revertedWith(
        'This contract does not accept ETH directly'
      )
    })
  })

  // Test suite for dispute resolution
  describe('Dispute Resolution', () => {
    it('should transition to Disputed status when a dispute is initiated', async function () {
      // Make a payment
      await token.connect(buyer).approve(escrowContractAddress, 1000000)
      await escrowContract.connect(buyer).pay()

      // Initiate a dispute
      await escrowContract.connect(buyer).dispute()

      // Check if status transitions to Disputed
      const contractStatus = await escrowContract.status()
      expect(contractStatus).to.equal(4, 'Status should be Disputed')
    })

    it('should transition to Resolved status after dispute resolution', async function () {
      // Make a payment
      await token.connect(buyer).approve(escrowContractAddress, 1000000)
      await escrowContract.connect(buyer).pay()

      // Initiate a dispute
      await escrowContract.connect(buyer).dispute()

      // Resolve the dispute
      await escrowContract.connect(arbitrator).resolveDispute(true)

      // Check if status transitions to Resolved
      const contractStatus = await escrowContract.status()
      expect(contractStatus).to.equal(5, 'Status should be Resolved')
    })

    it('should not allow the arbitrator to resolve a dispute in Created status', async () => {
      await expect(escrowContract.connect(arbitrator).resolveDispute(true)).to.be.revertedWith(
        'Invalid status'
      )
    })

    it('should not allow a non-arbitrator to resolve a dispute', async () => {
      // Make a payment
      await token.connect(buyer).approve(escrowContractAddress, 1000000)
      await escrowContract.connect(buyer).pay()

      // Initiate a dispute
      await escrowContract.connect(buyer).dispute()

      // Try to resolve the dispute as a non-arbitrator (should fail)
      const [nonArbitrator] = await ethers.getSigners()

      await expect(escrowContract.connect(nonArbitrator).resolveDispute(true)).to.be.revertedWith(
        'You are not the arbitrator'
      )
    })

    it('should emit Dispute and Resolved events during dispute resolution', async () => {
      // Make a payment
      await token.connect(buyer).approve(escrowContractAddress, 1000000)
      await escrowContract.connect(buyer).pay()

      // Initiate a dispute
      const disputeTx = await escrowContract.connect(buyer).dispute()
      expect(disputeTx).to.emit(escrowContract, 'Dispute').withArgs(buyer.address)

      // Resolve the dispute
      const resolutionTx = await escrowContract.connect(arbitrator).resolveDispute(true)
      expect(resolutionTx).to.emit(escrowContract, 'Resolved').withArgs(arbitrator.address, 5)
    })

    it('should transition back to Paid status after dispute resolution with false', async () => {
      // Transfer tokens to the buyer's address
      await token.transfer(buyerAddress, 1000000)

      // Approve the contract to spend tokens on behalf of the buyer
      await token.connect(buyer).approve(escrowContractAddress, 1000000)

      // Make a payment from the buyer's address
      await escrowContract.connect(buyer).pay()

      // Initiate a dispute
      await escrowContract.connect(buyer).dispute()

      // Resolve the dispute with a resolution of false
      await escrowContract.connect(arbitrator).resolveDispute(false)

      // Check if status transitions back to Paid
      const contractStatus = await escrowContract.status()
      expect(contractStatus).to.equal(1, 'Status should be Paid')
    })
  })

  // Test suite for delivery process
  describe('Delivery Process', () => {
    it('should transition to Delivered status after successful delivery', async () => {
      // Make a payment
      await token.connect(buyer).approve(escrowContractAddress, 1000000)
      await escrowContract.connect(buyer).pay()

      // Mark the item as delivered
      await escrowContract.connect(buyer).deliver()

      // Check if status transitions to Delivered
      const contractStatus = await escrowContract.status()
      expect(contractStatus).to.equal(2, 'Status should be Delivered')
    })

    it('should not allow the buyer to deliver before payment', async () => {
      // Try to mark the item as delivered before payment (should fail)
      await expect(escrowContract.connect(buyer).deliver()).to.be.revertedWith('Invalid status')
    })

    it('should not allow payment after delivery', async () => {
      // Make a payment
      await token.connect(buyer).approve(escrowContractAddress, 1000000)
      await escrowContract.connect(buyer).pay()

      // Mark the item as delivered
      await escrowContract.connect(buyer).deliver()

      // Try to make another payment (should fail)
      await expect(escrowContract.connect(buyer).pay()).to.be.revertedWith('Invalid status')
    })

    it('should not allow multiple deliveries', async () => {
      // Make a payment
      await token.connect(buyer).approve(escrowContractAddress, 1000000)
      await escrowContract.connect(buyer).pay()

      // Mark the item as delivered
      await escrowContract.connect(buyer).deliver()

      // Try to mark the item as delivered again (should fail)
      await expect(escrowContract.connect(buyer).deliver()).to.be.revertedWith('Invalid status')
    })

    it('should not allow the buyer to complete before delivery', async () => {
      // Make a payment
      await token.connect(buyer).approve(escrowContractAddress, 1000000)
      await escrowContract.connect(buyer).pay()

      // Try to complete the transaction before delivery (should fail)
      await expect(escrowContract.connect(buyer).complete()).to.be.revertedWith('Invalid status')
    })
  })

  // Test suite for events emitted by the contract
  describe('Events', () => {
    it('should emit Payment and Delivered events during payment and delivery', async () => {
      // Transfer tokens to the buyer's address
      await token.transfer(buyerAddress, 1000000)

      // Approve the contract to spend tokens on behalf of the buyer
      await token.connect(buyer).approve(escrowContractAddress, 1000000)

      // Make a payment from the buyer's address
      const paymentTx = await escrowContract.connect(buyer).pay()
      expect(paymentTx).to.emit(escrowContract, 'Payment').withArgs(buyer.address, 1000000)

      // Mark the item as delivered
      const deliveryTx = await escrowContract.connect(buyer).deliver()
      expect(deliveryTx).to.emit(escrowContract, 'Delivered').withArgs(buyer.address)
    })

    it('should emit Completed event after successful completion', async () => {
      // Make a payment
      await token.connect(buyer).approve(escrowContractAddress, 1000000)
      await escrowContract.connect(buyer).pay()

      // Mark the item as delivered
      await escrowContract.connect(buyer).deliver()

      // Complete the transaction
      const completionTx = await escrowContract.connect(buyer).complete()
      expect(completionTx).to.emit(escrowContract, 'Completed').withArgs(buyer.address)
    })

    it('should emit Dispute and Resolved events during dispute resolution', async () => {
      // Make a payment
      await token.connect(buyer).approve(escrowContractAddress, 1000000)
      await escrowContract.connect(buyer).pay()

      // Initiate a dispute
      const disputeTx = await escrowContract.connect(buyer).dispute()
      expect(disputeTx).to.emit(escrowContract, 'Dispute').withArgs(buyer.address)

      // Resolve the dispute
      const resolutionTx = await escrowContract.connect(arbitrator).resolveDispute(true)
      expect(resolutionTx).to.emit(escrowContract, 'Resolved').withArgs(arbitrator.address, 5)
    })
  })
})
