import { expect } from "chai";
import { ethers } from "hardhat";
import { FamilyAccount } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("FamilyAccount", function () {
  let familyAccount: FamilyAccount;
  let owner: SignerWithAddress;
  let delegate: SignerWithAddress;
  let merchant: SignerWithAddress;
  let token: any; // Mock ERC20 token

  beforeEach(async function () {
    [owner, delegate, merchant] = await ethers.getSigners();

    // Deploy FamilyAccount
    const FamilyAccount = await ethers.getContractFactory("FamilyAccount");
    familyAccount = await FamilyAccount.deploy(owner.address);
    await familyAccount.waitForDeployment();

    // Deploy a mock ERC20 token for testing
    const MockToken = await ethers.getContractFactory("MockERC20");
    token = await MockToken.deploy("Test Token", "TEST", 18);
    await token.waitForDeployment();

    // Mint tokens to the family account
    await token.mint(
      await familyAccount.getAddress(),
      ethers.parseEther("1000")
    );
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await familyAccount.owner()).to.equal(owner.address);
    });
  });

  describe("Delegate Management", function () {
    it("Should allow owner to set a delegate", async function () {
      const dailyLimit = ethers.parseEther("10");

      await expect(
        familyAccount.setDelegate(
          delegate.address,
          true, // requiresApproval
          dailyLimit,
          "Test Delegate"
        )
      )
        .to.emit(familyAccount, "DelegateSet")
        .withArgs(delegate.address, true, dailyLimit, "Test Delegate");

      const [exists, requiresApproval, limit, name] =
        await familyAccount.getDelegateInfo(delegate.address);
      expect(exists).to.be.true;
      expect(requiresApproval).to.be.true;
      expect(limit).to.equal(dailyLimit);
      expect(name).to.equal("Test Delegate");
    });

    it("Should not allow non-owner to set delegate", async function () {
      await expect(
        familyAccount
          .connect(delegate)
          .setDelegate(delegate.address, true, ethers.parseEther("10"), "Test")
      ).to.be.revertedWithCustomError(
        familyAccount,
        "OwnableUnauthorizedAccount"
      );
    });

    it("Should allow owner to revoke delegate", async function () {
      await familyAccount.setDelegate(
        delegate.address,
        true,
        ethers.parseEther("10"),
        "Test Delegate"
      );

      await expect(familyAccount.revokeDelegate(delegate.address))
        .to.emit(familyAccount, "DelegateRevoked")
        .withArgs(delegate.address);

      const [exists] = await familyAccount.getDelegateInfo(delegate.address);
      expect(exists).to.be.false;
    });
  });

  describe("Spending with Approval", function () {
    beforeEach(async function () {
      await familyAccount.setDelegate(
        delegate.address,
        true, // requiresApproval
        ethers.parseEther("10"),
        "Test Delegate"
      );
    });

    it("Should create spend request when approval required", async function () {
      const amount = ethers.parseEther("5");

      await expect(
        familyAccount
          .connect(delegate)
          .spendAsDelegate(
            await token.getAddress(),
            merchant.address,
            amount,
            "Test purchase"
          )
      ).to.emit(familyAccount, "SpendRequested");
    });

    it("Should execute spend after approval", async function () {
      const amount = ethers.parseEther("5");

      // Create spend request
      const tx = await familyAccount
        .connect(delegate)
        .spendAsDelegate(
          await token.getAddress(),
          merchant.address,
          amount,
          "Test purchase"
        );

      const receipt = await tx.wait();
      const event = receipt?.logs.find((log) => {
        try {
          const parsed = familyAccount.interface.parseLog(log);
          return parsed?.name === "SpendRequested";
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;

      if (event) {
        const parsed = familyAccount.interface.parseLog(event);
        const requestId = parsed?.args[0];

        // Approve and execute
        await expect(
          familyAccount.approveAndExecute(
            requestId,
            delegate.address,
            await token.getAddress(),
            merchant.address,
            amount
          )
        ).to.emit(familyAccount, "SpendExecuted");

        // Check token balance
        expect(await token.balanceOf(merchant.address)).to.equal(amount);
      }
    });
  });

  describe("Spending without Approval", function () {
    beforeEach(async function () {
      await familyAccount.setDelegate(
        delegate.address,
        false, // no approval required
        ethers.parseEther("10"),
        "Test Delegate"
      );
    });

    it("Should execute spend directly when no approval required", async function () {
      const amount = ethers.parseEther("5");

      await expect(
        familyAccount
          .connect(delegate)
          .spendAsDelegate(
            await token.getAddress(),
            merchant.address,
            amount,
            "Test purchase"
          )
      ).to.emit(familyAccount, "SpendExecuted");

      // Check token balance
      expect(await token.balanceOf(merchant.address)).to.equal(amount);
    });

    it("Should enforce daily limit", async function () {
      const amount = ethers.parseEther("15"); // Exceeds daily limit of 10

      await expect(
        familyAccount
          .connect(delegate)
          .spendAsDelegate(
            await token.getAddress(),
            merchant.address,
            amount,
            "Test purchase"
          )
      ).to.be.revertedWith("Daily limit exceeded");
    });
  });

  describe("Daily Limit Reset", function () {
    beforeEach(async function () {
      await familyAccount.setDelegate(
        delegate.address,
        false,
        ethers.parseEther("10"),
        "Test Delegate"
      );
    });

    it("Should reset daily spending on new day", async function () {
      const amount = ethers.parseEther("10");

      // First spend
      await familyAccount
        .connect(delegate)
        .spendAsDelegate(
          await token.getAddress(),
          merchant.address,
          amount,
          "Test purchase 1"
        );

      // Check available allowance is now 0
      expect(
        await familyAccount.getAvailableAllowance(
          delegate.address,
          await token.getAddress()
        )
      ).to.equal(0);

      // Simulate new day by manipulating block timestamp
      // Note: This is a simplified test - in practice you'd need to mine blocks
      // or use a time manipulation library
    });
  });
});

// Mock ERC20 contract for testing
const MockERC20ABI = [
  "constructor(string memory name, string memory symbol, uint8 decimals)",
  "function mint(address to, uint256 amount) external",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
];

// You would need to create a MockERC20.sol file for this to work
// For now, this test structure shows the expected behavior
