"use client";

import { createPortal } from "react-dom";
import { useState, useEffect, useSyncExternalStore } from "react";
import { Tag, CalendarDays, Check, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./Drawer.module.css";

const SPENDING_CATEGORIES = [
  { name: "Food", remaining: 60 },
  { name: "Transport", remaining: 20 },
  { name: "Entertainment", remaining: 30 },
  { name: "Utilities", remaining: 0 },
  { name: "Shopping", remaining: 90 },
  { name: "Health", remaining: 45 },
  { name: "Subscriptions", remaining: 0 },
  { name: "Dining Out", remaining: 80 },
  { name: "Clothing", remaining: 70 },
  { name: "Travel", remaining: 200 },
  { name: "Gym", remaining: 0 },
  { name: "Personal Care", remaining: 25 },
];

const INCOME_CATEGORIES = [
  { name: "Salary" },
  { name: "Freelance" },
  { name: "Investments" },
  { name: "Rental Income" },
  { name: "Side Business" },
  { name: "Dividends" },
  { name: "Gift" },
  { name: "Other" },
];

type Panel = "numpad" | "category" | "date";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function Drawer({ isOpen, onClose }: Props) {
  const [type, setType] = useState<"spending" | "income">("spending");
  const [amount, setAmount] = useState("0");
  const [note, setNote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>("numpad");
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [calendarDate, setCalendarDate] = useState(today);
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  function handleClose() {
    setType("spending");
    setAmount("0");
    setNote("");
    setSelectedCategory(null);
    setPanel("numpad");
    onClose();
  }

  function handleKey(key: string) {
    if (key === "⌫") {
      setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : "0");
    } else if (key === ".") {
      if (!amount.includes(".")) setAmount(prev => prev + ".");
    } else {
      setAmount(prev => {
        if (prev === "0") return key;
        if (prev.includes(".") && prev.split(".")[1].length >= 2) return prev;
        return prev + key;
      });
    }
  }

  function formatDate(date: Date) {
    if (date.toDateString() === today.toDateString()) return "Today";
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }

  function getFirstDayOfWeek(year: number, month: number) {
    return (new Date(year, month, 1).getDay() + 6) % 7;
  }

  function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  const numpadKeys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"];

  if (!mounted) return null;

  return createPortal(
    <>
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ""}`}
        onClick={handleClose}
      />
      <div className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ""}`}>
        <div className={styles.handle} />

        <div className={styles.toggle}>
          <button
            className={`${styles.toggleBtn} ${type === "income" ? styles.toggleActive : ""}`}
            onClick={() => setType("income")}
          >
            Income
          </button>
          <button
            className={`${styles.toggleBtn} ${type === "spending" ? styles.toggleActive : ""}`}
            onClick={() => setType("spending")}
          >
            Spending
          </button>
        </div>

        <p className={styles.amount} onClick={() => setPanel("numpad")}>€{amount}</p>

        <div className={styles.panel}>
          {panel === "numpad" && (
            <div className={styles.numpad}>
              {numpadKeys.map(key => (
                <button key={key} className={styles.numkey} onClick={() => handleKey(key)}>
                  {key}
                </button>
              ))}
            </div>
          )}

          {panel === "category" && (
            <div className={styles.categoryPanel}>
              <input
                className={styles.noteInput}
                placeholder="Add note...(optional)"
                value={note}
                onChange={e => setNote(e.target.value)}
              />
              <div className={styles.categoryList}>
                {type === "spending"
                  ? SPENDING_CATEGORIES.map(cat => {
                      const maxed = cat.remaining === 0;
                      const selected = selectedCategory === cat.name;
                      return (
                        <button
                          key={cat.name}
                          className={`${styles.categoryRow} ${selected ? styles.categoryRowSelected : ""}`}
                          onClick={() => setSelectedCategory(selected ? null : cat.name)}
                        >
                          <span>{cat.name}</span>
                          <span className={`${styles.categoryRight} ${maxed ? styles.maxed : ""}`}>
                            {maxed ? "Maxed Out" : `€${cat.remaining} left`}
                            {selected && !maxed && <Check size={14} strokeWidth={2.5} />}
                          </span>
                        </button>
                      );
                    })
                  : INCOME_CATEGORIES.map(cat => {
                      const selected = selectedCategory === cat.name;
                      return (
                        <button
                          key={cat.name}
                          className={`${styles.categoryRow} ${selected ? styles.categoryRowSelected : ""}`}
                          onClick={() => setSelectedCategory(selected ? null : cat.name)}
                        >
                          <span>{cat.name}</span>
                          {selected && <Check size={14} strokeWidth={2.5} className={styles.categoryRight} />}
                        </button>
                      );
                    })
                }
              </div>
            </div>
          )}

          {panel === "date" && (
            <div className={styles.datePanel}>
              <div className={styles.calendarHeader}>
                <button
                  className={styles.calendarNav}
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1))}
                >
                  <ChevronLeft size={20} />
                </button>
                <span>{calendarDate.toLocaleDateString("en-US", { month: "long" })}</span>
                <button
                  className={styles.calendarNav}
                  onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1))}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className={styles.calendarGrid}>
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <div key={i} className={styles.dayLabel}>{d}</div>
                ))}
                {Array.from({ length: getFirstDayOfWeek(calendarDate.getFullYear(), calendarDate.getMonth()) }).map((_, i) => (
                  <div key={`e${i}`} />
                ))}
                {Array.from({ length: getDaysInMonth(calendarDate.getFullYear(), calendarDate.getMonth()) }).map((_, i) => {
                  const d = i + 1;
                  const date = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), d);
                  const isSelected = date.toDateString() === selectedDate.toDateString();
                  const isToday = date.toDateString() === today.toDateString();
                  return (
                    <button
                      key={d}
                      className={`${styles.calDay} ${isSelected ? styles.calDaySelected : ""} ${isToday && !isSelected ? styles.calDayToday : ""}`}
                      onClick={() => setSelectedDate(date)}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className={styles.actionBar}>
          <button
            className={`${styles.actionBtn} ${panel === "category" ? styles.actionBtnActive : ""}`}
            onClick={() => setPanel("category")}
          >
            <Tag size={16} />
            Category
          </button>
          <button
            className={`${styles.actionBtn} ${panel === "date" ? styles.actionBtnActive : ""}`}
            onClick={() => setPanel("date")}
          >
            <CalendarDays size={16} />
            {formatDate(selectedDate)}
          </button>
          <button className={styles.doneBtn} onClick={handleClose}>Done</button>
        </div>
      </div>
    </>,
    document.body
  );
}
