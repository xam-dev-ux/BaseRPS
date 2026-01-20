import { ethers } from "hardhat";
import "dotenv/config";

function isValidAddress(address: string): boolean {
  try {
    // Check if it's a valid 40-character hex address (with 0x prefix)
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  } catch {
    return false;
  }
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Parse commission wallets from env
  const commissionWalletsEnv = process.env.COMMISSION_WALLETS || "";
  let commissionWallets = commissionWalletsEnv
    .split(",")
    .map((w) => w.trim())
    .filter((w) => w.length > 0);

  // Validate addresses - filter out invalid ones
  const validWallets = commissionWallets.filter((w) => {
    if (!isValidAddress(w)) {
      console.log(`⚠️  Invalid address skipped: ${w}`);
      return false;
    }
    return true;
  });

  // Use deployer address if no valid wallets provided
  if (validWallets.length === 0) {
    console.log("ℹ️  No valid commission wallets found. Using deployer address.");
    commissionWallets = [deployer.address];
  } else {
    commissionWallets = validWallets;
  }

  // Parse other config
  const commissionRate = parseInt(process.env.COMMISSION_RATE || "250"); // 2.5%
  const minBet = process.env.MIN_BET || ethers.parseEther("0.001").toString();
  const maxBet = process.env.MAX_BET || ethers.parseEther("1").toString();

  console.log("\nDeployment parameters:");
  console.log("- Commission wallets:", commissionWallets);
  console.log("- Commission rate:", commissionRate, "basis points");
  console.log("- Min bet:", ethers.formatEther(minBet), "ETH");
  console.log("- Max bet:", ethers.formatEther(maxBet), "ETH");

  // Deploy BaseRPS
  const BaseRPS = await ethers.getContractFactory("BaseRPS");
  const baseRPS = await BaseRPS.deploy(
    commissionWallets,
    commissionRate,
    minBet,
    maxBet
  );

  await baseRPS.waitForDeployment();

  const address = await baseRPS.getAddress();
  console.log("\n✅ BaseRPS deployed to:", address);

  // Log verification command
  console.log("\nTo verify on Basescan, run:");
  console.log(
    `npx hardhat verify --network <network> ${address} ` +
    `'["${commissionWallets.join('","')}"]' ${commissionRate} ${minBet} ${maxBet}`
  );

  // Write deployment info to file
  const deploymentInfo = {
    address,
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    params: {
      commissionWallets,
      commissionRate,
      minBet,
      maxBet,
    },
  };

  console.log("\nDeployment info:", JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
