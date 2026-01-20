import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  const contractAddress = "0x8b507Cc458991De15AF19dD2Ad19e72Bc551c5dF";

  const [owner] = await ethers.getSigners();
  console.log("Calling from account:", owner.address);

  const BaseRPS = await ethers.getContractAt("BaseRPS", contractAddress);

  // New bet limits
  const newMinBet = ethers.parseEther("0.00001"); // 0.00001 ETH
  const newMaxBet = ethers.parseEther("1");       // 1 ETH (keep same)

  console.log("Setting new bet limits:");
  console.log("- Min bet:", ethers.formatEther(newMinBet), "ETH");
  console.log("- Max bet:", ethers.formatEther(newMaxBet), "ETH");

  const tx = await BaseRPS.setBetLimits(newMinBet, newMaxBet);
  console.log("Transaction hash:", tx.hash);

  await tx.wait();
  console.log("✅ Bet limits updated successfully!");

  // Verify new values
  const currentMin = await BaseRPS.minBet();
  const currentMax = await BaseRPS.maxBet();
  console.log("\nNew values:");
  console.log("- minBet:", ethers.formatEther(currentMin), "ETH");
  console.log("- maxBet:", ethers.formatEther(currentMax), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
