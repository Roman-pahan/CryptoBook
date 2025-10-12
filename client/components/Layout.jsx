"use client";
import {
  useState,
  useEffect,
  Children,
  isValidElement,
  cloneElement,
} from "react"; // ← верный импорт
import "semantic-ui-css/semantic.min.css";
import { Container } from "semantic-ui-react";
import Header from "./Header";

const Layout = ({ children }) => {
  const [account, setAccount] = useState("");
  console.log("LayoutAccount: ", account);

  useEffect(() => {
    try {
      const _getAccount = localStorage.getItem("account") || "";
      if (_getAccount) setAccount(_getAccount);
    } catch {}
  }, []);

  const handleAccountChange = (_account) => {
    const _setAccount = _account.toLowerCase();
    setAccount(_setAccount);
    try {
      localStorage.setItem("account", _setAccount);
    } catch {}
  };

  const childrenMaybeWithAccount = Children.map(children, (child) => {
    if (!isValidElement(child)) return child; //проверка на сложный формат
    return child.props?.needsAccount ? cloneElement(child, { account }) : child;
    //проверка на наличие свойства needsAccount (закладываем данное свойство в page, если оно нам нужно)
    //cloneElement создание того же элемента с дополнительными пропсами
  });

  return (
    <Container>
      <Header onAccountChange={handleAccountChange} />
      {childrenMaybeWithAccount}
    </Container>
  );
};

export default Layout;
