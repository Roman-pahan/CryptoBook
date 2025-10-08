"use client";
import { ButtonOr, ButtonGroup, Button } from "semantic-ui-react";
import Layout from "../../components/Layout";
import { useRouter } from "next/navigation";
export default function Page() {
  const router = useRouter();
  return (
    <main style={{ padding: 24 }}>
      <Layout>
        <h1>Адресная книга социальных сетей: Discord и Telegram</h1>
        <ButtonGroup>
          <Button primary onClick={() => router.push("/show")}>
            Посмотреть
          </Button>
          <ButtonOr text={"||"} />
          <Button positive onClick={() => router.push("/add")}>
            Записать
          </Button>
        </ButtonGroup>
      </Layout>
    </main>
  );
}
