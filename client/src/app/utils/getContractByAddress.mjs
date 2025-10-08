import Contact from "../../../Contact.mjs";
import contactFactory from "../../../contactFactory.mjs";

const getContractByAddress = async (address) => {
  const contactAddress = await contactFactory.contracts(address);
  if (contactAddress === "0x0000000000000000000000000000000000000000") {
    throw new Error("Данный контакт отсутствует!");
  }
  console.log("contactAddress: ", contactAddress);
  const contact = Contact(contactAddress);
  const telegram = await contact.telegram();
  console.log("contactTelegram", telegram);
  const discord = await contact.discord();
  console.log("contactDiscord", discord);
  const desc = await contact.desc();
  console.log("contactDesc", desc);
  return { telegram, discord, desc };
};

export default getContractByAddress;
