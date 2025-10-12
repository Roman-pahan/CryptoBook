"use client";
import { Button, Menu, MenuItem } from "semantic-ui-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Header = ({ account, onAccountChange }) => {
  const router = useRouter();

  const handleLogInClick = async () => {
    const { ethereum } = window;
    if (!ethereum) {
      alert("Установите кошелек!");
      return;
    }
    try {
      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });
      const addr = (accounts?.[0] || "").toLowerCase();
      onAccountChange?.(addr); // пишем в общий стейт (Layout)
      router.push("/user"); //  переходим
    } catch (error) {
      console.log(error);
    }
  };

  console.log("Header account (from props): ", account);

  return (
    <Menu style={{ marginTop: "20px" }}>
      <Link href="/">
        <MenuItem>Главная</MenuItem>
      </Link>

      <Link href="/add">
        <MenuItem>Записать контакт</MenuItem>
      </Link>

      <Link href="/show">
        <MenuItem>Посмотреть контакт</MenuItem>
      </Link>
      <MenuItem position="right">
        {!account ? (
          <Button primary onClick={handleLogInClick}>
            Вход
          </Button>
        ) : (
          <Link href="/user">
            <Button primary>{account}</Button>
          </Link>
        )}
      </MenuItem>
    </Menu>
  );
};

export default Header;
