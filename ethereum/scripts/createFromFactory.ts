// scripts/createFromFactory.ts — ethers v5: create + verify, печатает лишь revert reason на ошибке
import { ethers } from "ethers";
import hre from "hardhat";
import "dotenv/config";

const FACTORY_FQN = "contracts/ContactFactory.sol:ContactFactory";
const BOOK_FQN = "contracts/CryptoBook.sol:CryptoBook";

// helpers
function getArg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 && i + 1 < process.argv.length
    ? process.argv[i + 1]
    : undefined;
}

// Error(string) selector = 0x08c379a0
function decodeRevertReason(data?: string): string | undefined {
  if (!data || !data.startsWith("0x08c379a0")) return;
  try {
    const reasonHex = "0x" + data.slice(10);
    const iface = new ethers.utils.Interface(["function Error(string)"]);
    const decoded = iface.decodeFunctionData("Error", reasonHex);
    return decoded?.[0];
  } catch {
    return;
  }
}

async function waitForBytecode(
  addr: string,
  provider: ethers.providers.Provider,
  tries = 20,
  ms = 6000
) {
  for (let i = 0; i < tries; i++) {
    const code = await provider.getCode(addr);
    if (code && code !== "0x") return true;
    await new Promise((r) => setTimeout(r, ms));
  }
  return false;
}

async function main() {
  const factoryAddr =
    getArg("--factory") ??
    process.env.FACTORY_ADDRESS ??
    (() => {
      throw new Error(
        "Укажи адрес фабрики: --factory 0x... или FACTORY_ADDRESS в .env"
      );
    })();

  const pk =
    getArg("--pk") ?? process.env.ALT_PRIVATE_KEY ?? process.env.PRIVATE_KEY;
  if (!pk)
    throw new Error(
      "Нет приватного ключа: --pk 0x... или ALT_PRIVATE_KEY/PRIVATE_KEY в .env"
    );

  const TELEGRAM = getArg("--tg") ?? "https://t.me/cryptobook1";
  const DISCORD = getArg("--dc") ?? "https://discord.gg/cryptobook1";

  const provider = new ethers.providers.JsonRpcProvider(
    process.env.SEPOLIA_RPC_URL!
  );
  const wallet = new ethers.Wallet(pk, provider);

  const facArtifact = await hre.artifacts.readArtifact(FACTORY_FQN);
  const factory = new ethers.Contract(factoryAddr, facArtifact.abi, wallet);

  try {
    // create
    const tx = await (factory as any)["createContact(string,string)"](
      TELEGRAM,
      DISCORD
    );
    const rc = await tx.wait();
    console.log("tx:", rc.transactionHash);

    // find book address (event → mapping)
    let bookAddr: string | undefined;
    const facIface = new ethers.utils.Interface(facArtifact.abi);
    for (const log of rc.logs) {
      try {
        const parsed = facIface.parseLog(log);
        if (parsed.name === "ContactCreated") {
          bookAddr = parsed.args.book;
          break;
        }
      } catch {}
    }
    if (!bookAddr) {
      const facRO = new ethers.Contract(
        factory.address,
        facArtifact.abi,
        provider
      );
      bookAddr = await facRO.contracts(wallet.address);
    }
    if (!bookAddr) throw new Error("Cannot resolve child address");

    console.log("child:", bookAddr);

    // wait for bytecode, then verify
    await provider.waitForTransaction(rc.transactionHash, 5);
    const seen = await waitForBytecode(bookAddr, provider, 20, 6000);
    if (!seen) {
      console.log("verify: skipped (bytecode not visible yet)");
      return;
    }

    await hre.run("verify:verify", {
      address: bookAddr,
      constructorArguments: [wallet.address, TELEGRAM, DISCORD],
      contract: BOOK_FQN,
    });
    console.log("verify: ok");
  } catch (err: any) {
    // печатаем только revert reason
    const rawData =
      err?.error?.data ??
      err?.data ??
      (() => {
        try {
          const b = err?.error?.body && JSON.parse(err.error.body);
          return b?.error?.data;
        } catch {
          return undefined;
        }
      })();

    const reason =
      err?.error?.reason || err?.reason || decodeRevertReason(rawData);
    if (reason) {
      console.error(reason);
    } else {
      console.error(err?.message || err);
    }
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});
