// deploy.js

async function main() {
  const [deployer, buyerAddress, arbitratorAddress] = await ethers.getSigners()

  console.log('Deploying contracts with the account:', deployer.address)

  // Deploy ERC20Mock
  const ERC20Mock = await ethers.getContractFactory('ERC20Mock')
  const token = await ERC20Mock.deploy('TEST TOKEN', 'TST')
  const tokenAddress = await token.getAddress()

  console.log('ERC20Mock deployed to:', tokenAddress)

  const price = 1000000 // Change with your desired price

  // Deploy the EscrowContract
  const EscrowContract = await ethers.getContractFactory('EscrowContract')
  const escrowContract = await EscrowContract.deploy(
    buyerAddress,
    arbitratorAddress,
    price,
    tokenAddress
  )
  const escrowContractAddress = await escrowContract.getAddress()

  console.log('EscrowContract deployed to:', escrowContractAddress)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
