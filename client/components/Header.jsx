"use client";
import { Menu, MenuItem } from "semantic-ui-react";
import Link from "next/link";

const Header = () => {
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
    </Menu>
  );
};

export default Header;
