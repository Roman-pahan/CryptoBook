"use client";
import Layout from "../../../components/Layout";
import {
  Button,
  Form,
  FormGroup,
  FormField,
  Input,
  Message,
} from "semantic-ui-react";
import { useState } from "react";
import getProvider from "../../../provider.mjs";
import contactFactory from "../../../contactFactory.mjs";

const AddContact = () => {
  const [telegram, setTelegram] = useState("");
  const [discord, setDiscord] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    await getProvider().send("eth_requestAccounts", []);
    const signer = getProvider().getSigner();
    console.log(signer);
    const contactFactoryWithSigner = contactFactory.connect(signer);
    console.log(contactFactory.functions);

    try {
      let response;
      if (discord) {
        response = await contactFactoryWithSigner[
          "createContact(string,string)"
        ](telegram, discord);
      } else {
        response = await contactFactoryWithSigner["createContact(string)"](
          telegram
        );
      }

      console.log("response: ", response);
      setSuccessMessage("Хэш транзакции: " + response.hash);
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message);
    }
  };

  return (
    <Layout>
      <Form
        error={!!errorMessage}
        success={!!successMessage}
        onSubmit={handleSubmit}
      >
        <FormGroup widths="equal">
          <FormField
            control={Input}
            label="Telegram"
            value={telegram}
            onChange={(event) => setTelegram(event.target.value)}
            placeholder="Ввод Telegram-адреса"
          />
          <FormField
            control={Input}
            label="Discord"
            value={discord}
            onChange={(event) => setDiscord(event.target.value)}
            placeholder="Ввод Discord-адреса"
          />
        </FormGroup>
        <Button primary>Сохранить</Button>
        <Message
          style={{ wordBreak: "break-word" }}
          error
          header="Ошибка добавления контакта!"
          content={errorMessage}
        />
        <Message
          success
          header="Контакт успешно добавлен!"
          content={successMessage}
        />
      </Form>
    </Layout>
  );
};

export default AddContact;
