import Image from "next/image";
import styles from "./page.module.css";
import design from "@/public/design.png";
import Link from "next/link";

export default function Home() {
  return (
    <main className={styles.main}>
      <Link href="/app" className={styles.button}>
        Coming Soon...
      </Link>
      <Image
        src={design}
        alt="App design"
        style={{ width: "300px", height: "auto" }}
      />
    </main>
  );
}
