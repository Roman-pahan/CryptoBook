const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

export default async function getContactWithSigner(props) {
  const { account, signer, contactFactory, Contact } = props;

  console.log("1. signer ->", signer);
  console.log("1. account ->", account);

  const signerAddress = (await signer.getAddress()).toLowerCase();

  console.log(account == signerAddress);
  if (account == signerAddress) {
    console.log("2. signerAddress ->", signerAddress);
    const contactAddress = await contactFactory.contracts(signerAddress);
    if (contactAddress === ZERO_ADDRESS) {
      throw new Error("Данный контакт отсутствует!");
    }

    console.log("3. contactAddress ->", contactAddress);
    const contactInstance =
      typeof contactAddress === "string"
        ? Contact(contactAddress)
        : contactAddress;
    console.log("4 .contactInstance ->", contactInstance);
    let ContactWithSigner = contactInstance.connect(signer);
    return ContactWithSigner;
  } else {
    throw new Error("Войдите в свой аккаунт");
  }
}
