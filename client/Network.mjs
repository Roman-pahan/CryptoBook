import getProvider from "/provider.mjs";

async function getNetworkInf() {
  const net = await getProvider().getNetwork();
  console.log("chainId =", net.chainId, "name =", net.name);
}

export default getNetworkInf();
