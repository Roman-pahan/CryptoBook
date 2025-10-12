"use client";
import Layout from "../../../components/Layout";
import { useState } from "react";
import { Form, Message } from "semantic-ui-react";
import getProvider from "../../../provider.mjs";
import Contact from "../../../Contact.mjs";
import contactFactory from "../../../contactFactory.mjs";
import getContactWithSigner from "../utils/getContactWithSigner.mjs";
import FieldWithSave from "./parts/FieldWithSave.jsx";

const UserContent = ({ account }) => {
  const [telegram, setTelegram] = useState("");
  const [discord, setDiscord] = useState("");
  const [desc, setDesc] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  console.log("userPage account: ", account);

  const fields = [
    {
      key: "telegram",
      label: "Telegram",
      placeholder: "Telegram",
      value: telegram,
      set: setTelegram,
      method: "setTelegram",
      name: "Telegram",
    },
    {
      key: "discord",
      label: "Discord",
      placeholder: "Discord",
      value: discord,
      set: setDiscord,
      method: "setDiscord",
      name: "Discord",
    },
    {
      key: "desc",
      label: "Description",
      placeholder: "Description",
      value: desc,
      set: setDesc,
      method: "setDesc",
      name: "Description",
    },
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    await getProvider().send("eth_requestAccounts", []);
    const signer = getProvider().getSigner();

    try {
      const ContactWithSigner = await getContactWithSigner({
        account,
        signer,
        contactFactory,
        Contact,
      });

      const btn = event.nativeEvent.submitter; // услышали нашу кнопку
      console.log("Слушаем кнопку: ", btn);
      const method = btn?.dataset?.method; // "setTelegram" | "setDiscord" | "setDesc"
      const name = btn?.dataset?.name;

      if (!method)
        throw new Error("Не удалось определить, какую кнопку нажали");

      let val = "";
      if (method === "setTelegram") val = telegram;
      if (method === "setDiscord") val = discord;
      if (method === "setDesc") val = desc;

      if (!val) throw new Error(`Поле "${name}" пустое`);

      const tx = await ContactWithSigner[method](val);
      await tx.wait();

      setTelegram("");
      setDiscord("");
      setDesc("");

      setSuccessMessage(`${name} сохранён`);
    } catch (error) {
      console.error(error);
      setErrorMessage(error.message);
      return;
    }
  };

  return (
    <Form
      error={!!errorMessage}
      success={!!successMessage}
      onSubmit={handleSubmit}
    >
      {fields.map((f) => (
        <FieldWithSave
          key={f.key}
          label={f.label}
          placeholder={f.placeholder}
          value={f.value}
          onChange={f.set}
          buttonText="Сохранить"
          method={f.method}
          name={f.name}
        />
      ))}

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
  );
};

const UserPage = () => {
  return (
    <Layout>
      <UserContent needsAccount />
    </Layout>
  );
};

export default UserPage;
