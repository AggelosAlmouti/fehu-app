import styles from "./BudgetCard.module.css";

type BudgetCardProps = {
  name: string;
  spent: number;
  total: number;
};

const today = new Date();
const daysInMonth = new Date(
  today.getFullYear(),
  today.getMonth() + 1,
  0,
).getDate();
const monthProgress = today.getDate() / daysInMonth;

function getBarColor(spent: number, total: number) {
  const spentRatio = spent / total;
  if (spentRatio >= 1) return "red";
  if (spentRatio > monthProgress) return "orange";
  return "green";
}

export default function BudgetCard({ name, spent, total }: BudgetCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span>{name}</span>
        <span>
          {spent}/{total}€
        </span>
      </div>
      <div className={styles.progressTrack}>
        <div
          className={styles.progressBar}
          style={{
            width: `${Math.min((spent / total) * 100, 100)}%`,
            backgroundColor: getBarColor(spent, total),
          }}
        />
        <div className={styles.tick} style={{ left: "25%" }} />
        <div className={styles.tick} style={{ left: "50%" }} />
        <div className={styles.tick} style={{ left: "75%" }} />
      </div>
    </div>
  );
}
