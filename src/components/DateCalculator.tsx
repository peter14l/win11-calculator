import React, { useState, useEffect } from "react";

type DateCalcMode = "difference" | "add_subtract";

export const DateCalculator: React.FC = () => {
  const [subMode, setSubMode] = useState<DateCalcMode>("difference");
  
  // State for Date Difference
  const [fromDate, setFromDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [toDate, setToDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [dateDiffResult, setDateDiffResult] = useState<string>("");

  // State for Add/Subtract Days
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [operation, setOperation] = useState<"add" | "subtract">("add");
  const [years, setYears] = useState<number>(0);
  const [months, setMonths] = useState<number>(0);
  const [days, setDays] = useState<number>(0);
  const [dateAddResult, setDateAddResult] = useState<string>("");

  useEffect(() => {
    calculateDifference();
  }, [fromDate, toDate]);

  useEffect(() => {
    calculateAddSubtract();
  }, [startDate, operation, years, months, days]);

  const calculateDifference = () => {
    const d1 = new Date(fromDate);
    const d2 = new Date(toDate);
    
    if (isNaN(d1.getTime()) || !isFinite(d1.getTime()) || isNaN(d2.getTime()) || !isFinite(d2.getTime())) {
      setDateDiffResult("Invalid date selection");
      return;
    }

    // Swap if d1 > d2
    let start = d1;
    let end = d2;
    let isSwapped = false;
    if (d1 > d2) {
      start = d2;
      end = d1;
      isSwapped = true;
    }

    const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate Years, Months, Days
    let startYear = start.getFullYear();
    let startMonth = start.getMonth();
    let startDay = start.getDate();

    let endYear = end.getFullYear();
    let endMonth = end.getMonth();
    let endDay = end.getDate();

    let diffYears = endYear - startYear;
    let diffMonths = endMonth - startMonth;
    let diffDays = endDay - startDay;

    if (diffDays < 0) {
      // Borrow days from previous month
      const prevMonth = new Date(endYear, endMonth, 0);
      diffDays += prevMonth.getDate();
      diffMonths--;
    }

    if (diffMonths < 0) {
      diffMonths += 12;
      diffYears--;
    }

    const yearStr = diffYears > 0 ? `${diffYears} year${diffYears !== 1 ? "s" : ""}` : "";
    const monthStr = diffMonths > 0 ? `${diffMonths} month${diffMonths !== 1 ? "s" : ""}` : "";
    const dayStr = diffDays > 0 ? `${diffDays} day${diffDays !== 1 ? "s" : ""}` : "";

    const parts = [yearStr, monthStr, dayStr].filter(p => p !== "");
    const mainDiff = parts.join(", ") || "Same date";
    const totalDiffStr = totalDays > 0 ? `Total days: ${totalDays}` : "";

    setDateDiffResult(
      isSwapped 
        ? `${mainDiff} (counted backwards) \n ${totalDiffStr}` 
        : `${mainDiff} \n ${totalDiffStr}`
    );
  };

  const calculateAddSubtract = () => {
    const start = new Date(startDate);
    if (isNaN(start.getTime())) {
      setDateAddResult("Invalid date");
      return;
    }

    const factor = operation === "add" ? 1 : -1;
    
    const resultDate = new Date(start);
    resultDate.setFullYear(start.getFullYear() + (years * factor));
    resultDate.setMonth(start.getMonth() + (months * factor));
    resultDate.setDate(start.getDate() + (days * factor));

    const options: Intl.DateTimeFormatOptions = { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    };
    setDateAddResult(resultDate.toLocaleDateString(undefined, options));
  };

  return (
    <div style={styles.container}>
      {/* Date sub-mode selection */}
      <div style={styles.tabContainer}>
        <button 
          style={{
            ...styles.tabBtn,
            borderBottom: subMode === "difference" ? "3px solid var(--text-accent)" : "none",
            fontWeight: subMode === "difference" ? 600 : 400
          }}
          onClick={() => setSubMode("difference")}
        >
          Difference between dates
        </button>
        <button 
          style={{
            ...styles.tabBtn,
            borderBottom: subMode === "add_subtract" ? "3px solid var(--text-accent)" : "none",
            fontWeight: subMode === "add_subtract" ? 600 : 400
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
                {dateDiffResult.split("\n").map((line, i) => (
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
                  max="999"
                  style={styles.numInput}
                  value={years}
                  onChange={(e) => setYears(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>
              <div style={styles.offsetGroup}>
                <label style={styles.label}>Months</label>
                <input 
                  type="number" 
                  min="0"
                  max="999"
                  style={styles.numInput}
                  value={months}
                  onChange={(e) => setMonths(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>
              <div style={styles.offsetGroup}>
                <label style={styles.label}>Days</label>
                <input 
                  type="number" 
                  min="0"
                  max="9999"
                  style={styles.numInput}
                  value={days}
                  onChange={(e) => setDays(Math.max(0, parseInt(e.target.value) || 0))}
                />
              </div>
            </div>

            <div style={styles.resultBox}>
              <div style={styles.resultLabel}>Date</div>
              <div style={styles.resultMain}>{dateAddResult}</div>
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
