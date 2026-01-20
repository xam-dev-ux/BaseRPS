import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
  const contractAddress = "0x8b507Cc458991De15AF19dD2Ad19e72Bc551c5dF";

  const [owner] = await ethers.getSigners();
  console.log("Calling from account:", owner.address);

  const BaseRPS = await ethers.getContractAt("BaseRPS", contractAddress);

  // New timeouts (in seconds)
  const commitTimeout = 43200;  // 12 hours for commit phase
  const revealTimeout = 43200;  // 12 hours for reveal phase
  const matchExpiry = 86400;    // 24 hours for match expiry

  console.log("Setting new timeouts:");
  console.log("- Commit timeout:", commitTimeout, "seconds (", commitTimeout / 3600, "hours)");
  console.log("- Reveal timeout:", revealTimeout, "seconds (", revealTimeout / 3600, "hours)");
  console.log("- Match expiry:", matchExpiry, "seconds (", matchExpiry / 3600, "hours)");

  const tx = await BaseRPS.setTimeouts(commitTimeout, revealTimeout, matchExpiry);
  console.log("Transaction hash:", tx.hash);

  await tx.wait();
  console.log("Timeouts updated successfully!");

  // Verify new values
  const currentCommit = await BaseRPS.commitTimeout();
  const currentReveal = await BaseRPS.revealTimeout();
  const currentExpiry = await BaseRPS.matchExpiry();
  console.log("\nNew values:");
  console.log("- commitTimeout:", currentCommit.toString(), "seconds");
  console.log("- revealTimeout:", currentReveal.toString(), "seconds");
  console.log("- matchExpiry:", currentExpiry.toString(), "seconds");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
