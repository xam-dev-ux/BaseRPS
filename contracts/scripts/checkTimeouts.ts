import { ethers } from "hardhat";

async function main() {
  const contractAddress = "0x8b507Cc458991De15AF19dD2Ad19e72Bc551c5dF";
  const BaseRPS = await ethers.getContractAt("BaseRPS", contractAddress);

  console.log("Current timeouts:");
  console.log("- commitTimeout:", (await BaseRPS.commitTimeout()).toString(), "seconds");
  console.log("- revealTimeout:", (await BaseRPS.revealTimeout()).toString(), "seconds");
  console.log("- matchExpiry:", (await BaseRPS.matchExpiry()).toString(), "seconds");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
