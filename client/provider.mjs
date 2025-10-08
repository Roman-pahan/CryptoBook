import { ethers } from "ethers";

const FALLBACK_RPC =
  process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://rpc.sepolia.org";

// НИЧЕГО не создаём на уровне модуля
export default function getProvider() {
  // в браузере с MetaMask → Web3Provider
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.providers.Web3Provider(window.ethereum, "any");
  }
  // иначе — обычный RPC для чтения
  return new ethers.providers.JsonRpcProvider(FALLBACK_RPC);
}
