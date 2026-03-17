import React from "react";
import BottomNav from "../components/BottomNav/BottomNav";
import styles from "./layout.module.css";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className={styles.main}>{children}</main>
      <BottomNav />
    </>
  );
}
