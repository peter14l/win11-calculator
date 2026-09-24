import type React from "react";
import { useState } from "react";

type DateCalcMode = "difference" | "add_subtract";

const toLocalDateStr = (d: Date): string => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const todayStr = (): string => toLocalDateStr(new Date());

const parseLocal = (s: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (
    d.getFullYear() !== Number(m[1]) ||
    d.getMonth() !== Number(m[2]) - 1 ||
    d.getDate() !== Number(m[3])
  ) {
    return null;
  }
  return d;
};

const utcDay = (d: Date): number =>
  Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

const formatDate = (d: Date): string =>
  d.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

export const DateCalculator: React.FC = () => {
  const [subMode, setSubMode] = useState<DateCalcMode>("difference");
  const [fromDate, setFromDate] = useState<string>(todayStr);
  const [toDate, setToDate] = useState<string>(todayStr);
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [operation, setOperation] = useState<"add" | "subtract">("add");
  const [years, setYears] = useState<number>(0);
  const [months, setMonths] = useState<number>(0);
  const [days, setDays] = useState<number>(0);

  const diffResult = (() => {
    const d1 = parseLocal(fromDate);
    const d2 = parseLocal(toDate);
    if (!d1 || !d2) return "Invalid date selection";

    let a = d1;
    let b = d2;
    let swapped = false;
    if (utcDay(a) > utcDay(b)) {
      [a, b] = [b, a];
      swapped = true;
    }

    const totalDays = Math.round((utcDay(b) - utcDay(a)) / 86400000);
    let diffYears = b.getFullYear() - a.getFullYear();
    let diffMonths = b.getMonth() - a.getMonth();
    let diffDays = b.getDate() - a.getDate();
    if (diffDays < 0) {
      diffDays += new Date(b.getFullYear(), b.getMonth(), 0).getDate();
      diffMonths--;
    }
    if (diffMonths < 0) {
      diffMonths += 12;
      diffYears--;
    }

    const part = (n: number, unit: string) => (n > 0 ? `${n} ${unit}${n !== 1 ? "s" : ""}` : "");
    const parts = [part(diffYears, "year"), part(diffMonths, "month"), part(diffDays, "day")].filter(Boolean);
    const main = parts.join(", ") || "Same date";
    return swapped
      ? `${main} (counted backwards)\nTotal days: ${totalDays}`
      : `${main}\nTotal days: ${totalDays}`;
  })();

  const addResult = (() => {
    const base = parseLocal(startDate);
    if (!base) return "Invalid date";
    const f = operation === "add" ? 1 : -1;

    const yearTarget = base.getFullYear() + years * f;
    const monthTarget = base.getMonth() + months * f;
    const norm = new Date(yearTarget, monthTarget, 1);
    const dim = new Date(norm.getFullYear(), norm.getMonth() + 1, 0).getDate();
    const result = new Date(norm.getFullYear(), norm.getMonth(), Math.min(base.getDate(), dim) + days * f);
    if (Number.isNaN(result.getTime())) return "Invalid date";
    return formatDate(result);
  })();

  return (
    <div style={styles.container}>
      <div style={styles.tabContainer}>
        <button
          style={{
            ...styles.tabBtn,
            borderBottom: subMode === "difference" ? "3px solid var(--text-accent)" : "none",
            fontWeight: subMode === "difference" ? 600 : 400,
          }}
          onClick={() => setSubMode("difference")}
        >
          Difference between dates
        </button>
        <button
          style={{
            ...styles.tabBtn,
            borderBottom: subMode === "add_subtract" ? "3px solid var(--text-accent)" : "none",
            fontWeight: subMode === "add_subtract" ? 600 : 400,
          }}
          onClick={() => setSubMode("add_subtract")}
        >
          Add or subtract days
        </button>
      </div>

      <div style={styles.content}>
        {subMode === "difference" ? (
          <div style={styles.calcView}>
            <div style={styles.formGroup}>
              <label style={styles.label}>From</label>
              <input
                type="date"
                style={styles.dateInput}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>To</label>
              <input
                type="date"
                style={styles.dateInput}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>

            <div style={styles.resultBox}>
              <div style={styles.resultLabel}>Difference</div>
              <div style={styles.resultText}>
                {diffResult.split("\n").map((line, i) => (
                  <div key={i} style={i === 0 ? styles.resultMain : styles.resultSub}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.calcView}>
            <div style={styles.formGroup}>
              <label style={styles.label}>From</label>
              <input
                type="date"
                style={styles.dateInput}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div style={styles.radioGroup}>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="operation"
                  checked={operation === "add"}
                  onChange={() => setOperation("add")}
                  style={styles.radioInput}
                />
                Add
              </label>
              <label style={styles.radioLabel}>
                <input
                  type="radio"
                  name="operation"
                  checked={operation === "subtract"}
                  onChange={() => setOperation("subtract")}
                  style={styles.radioInput}
                />
                Subtract
              </label>
            </div>

            <div style={styles.offsetInputs}>
              <div style={styles.offsetGroup}>
                <label style={styles.label}>Years</label>
                <input
                  type="number"
                  min="0"
                  style={styles.numInput}
                  value={years}
                  onChange={(e) => setYears(Math.max(0, parseInt(e.target.value, 10) || 0))}
                />
              </div>
              <div style={styles.offsetGroup}>
                <label style={styles.label}>Months</label>
                <input
                  type="number"
                  min="0"
                  style={styles.numInput}
                  value={months}
                  onChange={(e) => setMonths(Math.max(0, parseInt(e.target.value, 10) || 0))}
                />
              </div>
              <div style={styles.offsetGroup}>
                <label style={styles.label}>Days</label>
                <input
                  type="number"
                  min="0"
                  style={styles.numInput}
                  value={days}
                  onChange={(e) => setDays(Math.max(0, parseInt(e.target.value, 10) || 0))}
                />
              </div>
            </div>

            <div style={styles.resultBox}>
              <div style={styles.resultLabel}>Date</div>
              <div style={styles.resultMain}>{addResult}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: "0 24px 24px 24px",
    flex: 1,
    overflowY: "auto",
  },
  tabContainer: {
    display: "flex",
    gap: "16px",
    borderBottom: "1px solid var(--border-subtle)",
    marginBottom: "24px",
  },
  tabBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-main)",
    padding: "8px 0",
    cursor: "pointer",
    fontSize: "14px",
  },
  content: {
    flex: 1,
  },
  calcView: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    maxWidth: "400px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "13px",
    fontWeight: 600,
    color: "var(--text-main)",
  },
  dateInput: {
    backgroundColor: "var(--bg-btn-op)",
    color: "var(--text-main)",
    border: "1px solid var(--border-app)",
    padding: "10px 12px",
    borderRadius: "4px",
    fontSize: "14px",
    outline: "none",
    width: "100%",
    colorScheme: "dark",
  },
  radioGroup: {
    display: "flex",
    gap: "24px",
  },
  radioLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    cursor: "pointer",
  },
  radioInput: {
    accentColor: "var(--text-accent)",
    cursor: "pointer",
  },
  offsetInputs: {
    display: "flex",
    gap: "12px",
  },
  offsetGroup: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  numInput: {
    backgroundColor: "var(--bg-btn-op)",
    color: "var(--text-main)",
    border: "1px solid var(--border-app)",
    padding: "10px 8px",
    borderRadius: "4px",
    fontSize: "14px",
    outline: "none",
    width: "100%",
  },
  resultBox: {
    marginTop: "16px",
    padding: "16px",
    backgroundColor: "var(--bg-btn-op)",
    borderRadius: "6px",
    border: "1px solid var(--border-subtle)",
  },
  resultLabel: {
    fontSize: "12px",
    color: "var(--text-sec)",
    marginBottom: "6px",
  },
  resultText: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  resultMain: {
    fontSize: "24px",
    fontWeight: 600,
    color: "var(--text-main)",
  },
  resultSub: {
    fontSize: "13px",
    color: "var(--text-sec)",
  },
};