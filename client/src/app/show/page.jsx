"use client";
import { useRef, useState } from "react";
import Layout from "../../../components/Layout";
import { Form, FormField, Button, Message } from "semantic-ui-react";
import { ethers } from "ethers";
import getContractByAddress from "../utils/getContractByAddress.mjs";
import getNetworkInf from "../../../Network.mjs";

const ShowContact = () => {
  const [telegram, setTelegram] = useState();
  const [discord, setDiscord] = useState();
  const [desc, setDesc] = useState();
  const [isLoading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState();

  const addressRef = useRef();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const address = addressRef.current.value;
    setTelegram("");
    setDiscord("");
    setDesc("");
    setErrorMessage("");
    if (!address) {
      setErrorMessage("Требуется адрес!");
    }
    if (!ethers.utils.isAddress(address)) {
      setErrorMessage("Неверный адрес");
      return;
    }
    getNetworkInf;
    setLoading(true);
    try {
      const contact = await getContractByAddress(address);
      setTelegram(contact.telegram);
      setDiscord(contact.discord);
      setDesc(contact.desc);
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Form error={!!errorMessage} onSubmit={handleSubmit}>
        <FormField>
          <label>Введите адрес</label>
          <input ref={addressRef} placeholder="Введите адрес" />
        </FormField>
        <Button loading={isLoading} primary type="submit">
          Посмотреть
        </Button>
        <Message error header="Внимание ошибка!" content={errorMessage} />
      </Form>
      {telegram && <h2>Telegram: {telegram}</h2>}
      {discord && <h2>Discord: {discord}</h2>}
      {desc && <h2>Description: {desc}</h2>}
    </Layout>
  );
};

export default ShowContact;
