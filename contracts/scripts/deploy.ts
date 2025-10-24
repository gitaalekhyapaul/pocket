import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log(
    "Account balance:",
    (await ethers.provider.getBalance(deployer.address)).toString()
  );

  // Deploy FamilyAccount
  console.log("\nDeploying FamilyAccount...");
  const FamilyAccount = await ethers.getContractFactory("FamilyAccount");
  const familyAccount = await FamilyAccount.deploy(deployer.address);
  await familyAccount.waitForDeployment();

  const familyAccountAddress = await familyAccount.getAddress();
  console.log("FamilyAccount deployed to:", familyAccountAddress);

  // Save deployment info
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    deployer: deployer.address,
    familyAccount: familyAccountAddress,
    timestamp: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const networkName = (await ethers.provider.getNetwork()).name;
  const deploymentFile = path.join(deploymentsDir, `${networkName}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("\nDeployment completed successfully!");
  console.log("Deployment info saved to:", deploymentFile);

  // Verify contract if on a supported network
  if (
    networkName === "sepolia" ||
    networkName === "base" ||
    networkName === "baseSepolia"
  ) {
    console.log("\nWaiting for contract to be mined...");
    await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds

    try {
      console.log("Verifying contract on Etherscan...");
      await hre.run("verify:verify", {
        address: familyAccountAddress,
        constructorArguments: [deployer.address],
      });
      console.log("Contract verified successfully!");
    } catch (error) {
      console.log("Verification failed:", error);
    }
  }

  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("Network:", networkName);
  console.log("FamilyAccount:", familyAccountAddress);
  console.log("Deployer:", deployer.address);
  console.log("\nNext steps:");
  console.log("1. Update your .env files with the contract address");
  console.log("2. Fund the contract with tokens for testing");
  console.log("3. Set up delegates using setDelegate()");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
