// scripts/deployFactory.ts
import { ethers } from "ethers";
import hre from "hardhat";
import "dotenv/config";

const FACTORY_FQN = "contracts/ContactFactory.sol:ContactFactory";
const BOOK_FQN = "contracts/CryptoBook.sol:CryptoBook";

const TELEGRAM = process.env.BOOK_TELEGRAM ?? "https://t.me/cryptobook";
const DISCORD = process.env.BOOK_DISCORD ?? "https://discord.gg/cryptobook";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForBytecode(
  addr: string,
  provider: ethers.providers.Provider,
  tries = 30,
  ms = 4000
) {
  for (let i = 0; i < tries; i++) {
    const code = await provider.getCode(addr);
    if (code && code !== "0x") {
      if (i > 0) console.log(`ℹ️ Bytecode detected after ${i} checks`);
      return true;
    }
    if (i === 0) console.log(`⏳ Waiting for bytecode at ${addr}…`);
    await sleep(ms);
  }
  return false;
}

async function verifyWithRetry(params: {
  address: string;
  constructorArguments?: any[];
  contract?: string; // e.g. "contracts/CryptoBook.sol:CryptoBook"
  maxRetries?: number;
  delayMs?: number;
}) {
  const {
    address,
    constructorArguments = [],
    contract,
    maxRetries = 5,
    delayMs = 4000,
  } = params;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      await hre.run("verify:verify", {
        address,
        constructorArguments,
        contract,
      });
      console.log("✅ Verified:", address);
      return;
    } catch (e: any) {
      const msg = String(e?.message || e || "");
      if (/already verified/i.test(msg)) {
        console.log("ℹ️ Already verified:", address);
        return;
      }
      if (
        /does not have bytecode|Missing or invalid contract code/i.test(msg)
      ) {
        // индексация ещё не догнала; подождём и повторим
        console.log(
          `⏳ Etherscan hasn't indexed bytecode yet. Retry soon… (${i}/${maxRetries})`
        );
      } else if (/Too Many Requests|rate limit|Max rate limit/i.test(msg)) {
        console.log(
          `⏳ Rate-limited by explorer. Backing off… (${i}/${maxRetries})`
        );
      } else if (/Contract source code already verified/i.test(msg)) {
        console.log("ℹ️ Already verified by explorer UI:", address);
        return;
      } else {
        console.log(`⚠️ Verify attempt failed (${i}/${maxRetries}):`, msg);
      }
      if (i === maxRetries) throw e;
      await sleep(delayMs);
    }
  }
}

async function resolveBookAddress(
  factoryAddress: string,
  facAbi: any[],
  receipt: ethers.providers.TransactionReceipt,
  provider: ethers.providers.Provider,
  deployer: string
): Promise<string> {
  const facIface = new ethers.utils.Interface(facAbi);

  // 1) Событие (лучший вариант)
  for (const log of receipt.logs ?? []) {
    try {
      const parsed = facIface.parseLog(log);
      if (parsed?.name === "ContactCreated") {
        const a =
          parsed.args?.book ?? parsed.args?.contact ?? parsed.args?.addr;
        if (a && ethers.utils.isAddress(a)) return ethers.utils.getAddress(a);
      }
    } catch {}
  }

  // 2) Read-only методы фабрики (популярные нейминги)
  const facRO = new ethers.Contract(factoryAddress, facAbi, provider);
  const candidateCalls = [
    "getBook",
    "books",
    "contacts",
    "contracts",
    "registry",
    "ownerToBook",
  ];
  for (const fn of candidateCalls) {
    if (typeof facRO[fn] === "function") {
      try {
        const val = await facRO[fn](deployer);
        if (val && ethers.utils.isAddress(val))
          return ethers.utils.getAddress(val);
      } catch {}
    }
  }

  throw new Error(
    "Не удалось определить адрес дочернего контракта из события/маппинга фабрики."
  );
}

async function main() {
  // 0) Провайдер/кошелёк (ethers v5)
  const rpc = process.env.SEPOLIA_RPC_URL!;
  const pk = process.env.PRIVATE_KEY!;
  if (!rpc || !pk) {
    throw new Error("Отсутствуют SEP0LIA_RPC_URL/PRIVATE_KEY в .env");
  }
  const provider = new ethers.providers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(pk, provider);

  const net = await provider.getNetwork();
  console.log(`🌐 Network: chainId=${net.chainId}, name=${net.name}`);
  if (net.chainId !== 11155111) {
    console.warn("⚠️ Вы не в Sepolia (11155111). Проверьте RPC/--network.");
  }

  // 1) DEPLOY фабрики
  const facArtifact = await hre.artifacts.readArtifact(FACTORY_FQN);
  const FactoryCF = new ethers.ContractFactory(
    facArtifact.abi,
    facArtifact.bytecode,
    wallet
  );
  const factory = await FactoryCF.deploy();
  await factory.deployed();
  console.log("🚀 ContactFactory:", factory.address);

  await factory.deployTransaction.wait(5);
  console.log("⏳ waited 5 confirmations (factory)");

  // 2) VERIFY фабрики
  try {
    await verifyWithRetry({
      address: factory.address,
      constructorArguments: [],
      contract: FACTORY_FQN,
      maxRetries: 3,
      delayMs: 4000,
    });
    console.log("✅ Factory verified");
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (/already verified/i.test(msg))
      console.log("ℹ️ Factory already verified");
    else console.error("❌ Factory verify error:", msg);
  }

  // 3) CREATE дочерний (учитываем перегрузку createContact)
  const createFn =
    (factory as any)["createContact(string,string)"] ??
    (factory as any).createContact;
  if (!createFn)
    throw new Error(
      "В фабрике нет метода createContact или его перегрузки (string,string)."
    );

  const tx = await createFn(TELEGRAM, DISCORD);
  console.log("🧩 createContact tx:", tx.hash);
  const rc = await tx.wait(5); // ждём 5 подтверждений ИМЕННО создания
  console.log("⏳ waited 5 confirmations (createContact)");

  // 4) Достаём адрес книги: событие → fallback mapping
  const bookAddr = await resolveBookAddress(
    factory.address,
    facArtifact.abi,
    rc,
    provider,
    wallet.address
  );
  console.log("📒 CryptoBook:", bookAddr);

  // 5) ЖДЁМ, ПОКА узлы/индексаторы увидят байткод дочернего
  const seen = await waitForBytecode(bookAddr, provider, 30, 4000);
  if (!seen)
    throw new Error(
      `Bytecode not found on ${bookAddr} after waiting; increase tries/delay.`
    );

  // 6) VERIFY дочернего
  try {
    await verifyWithRetry({
      address: bookAddr,
      constructorArguments: [wallet.address, TELEGRAM, DISCORD],
      contract: BOOK_FQN,
      maxRetries: 6,
      delayMs: 5000,
    });
    console.log("✅ CryptoBook verified");
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (/already verified/i.test(msg))
      console.log("ℹ️ CryptoBook already verified");
    else console.error("❌ CryptoBook verify error:", msg);
  }
}

main().catch((e) => {
  console.error("❌ Error:", e);
  process.exit(1);
});
