// scripts/deploy.ts — ethers v5 + верификация c owner
import { ethers } from "ethers";
import hre from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const FULLY_QUALIFIED = "contracts/CryptoBook.sol:CryptoBook";

const TELEGRAM = "https://t.me/cryptobook";
const DISCORD = "https://discord.gg/cryptobook";

async function main() {
  // DEPLOY (ethers v5)
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.SEPOLIA_RPC_URL!
  );
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const artifact = require("../artifacts/contracts/CryptoBook.sol/CryptoBook.json");

  // ВАЖНО: конструктор ожидает (address _owner, string _telegram, string _discord)
  const constructorArgs = [wallet.address, TELEGRAM, DISCORD];

  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );
  const c = await factory.deploy(...constructorArgs);
  await c.deployed();

  const addr = c.address;
  console.log("🚀 Deployed at:", addr);

  // ждём 5 подтверждений, чтобы индексер Etherscan подхватил контракт
  await c.deployTransaction.wait(5);
  console.log("⏳ waited 5 confirmations");

  // VERIFY (через плагин)
  try {
    await hre.run("verify:verify", {
      address: addr,
      constructorArguments: constructorArgs,
      contract: FULLY_QUALIFIED,
    });
    console.log("✅ Verified on Etherscan");
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (/already verified/i.test(msg)) {
      console.log("ℹ️ Already verified");
    } else {
      console.error("❌ Verify error:", msg);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
