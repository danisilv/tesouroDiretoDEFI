import { ethers } from "hardhat";

async function main() {
  const contract = await ethers.deployContract("TesouroDireto" );

  await contract.waitForDeployment();
  let accounts = await ethers.getSigners();
  contract.connect(accounts[1]);

  console.log(
    `deployed to ${contract.target}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
