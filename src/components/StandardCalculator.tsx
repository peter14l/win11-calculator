import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
}

interface StandardCalculatorProps {
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  history: HistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
}

export const StandardCalculator: React.FC<StandardCalculatorProps> = ({
  isHistoryOpen,
  setIsHistoryOpen,
  history,
  setHistory,
}) => {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [prevVal, setPrevVal] = useState<number | null>(null);
  const [activeOp, setActiveOp] = useState<string | null>(null);
  const [shouldReset, setShouldReset] = useState(false);
  
  // Memory state
  const [memory, setMemory] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<"history" | "memory">("history");

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      if (/[0-9]/.test(key)) handleNumber(key);
      else if (key === ".") handleDecimal();
      else if (key === "+") handleOperator("+");
      else if (key === "-") handleOperator("-");
      else if (key === "*") handleOperator("×");
      else if (key === "/") {
        e.preventDefault();
        handleOperator("÷");
      }
      else if (key === "Enter" || key === "=") {
        e.preventDefault();
        handleEquals();
      }
      else if (key === "Backspace") handleBackspace();
      else if (key === "Escape") handleClear();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [display, expression, prevVal, activeOp, shouldReset]);

  // Clean float formatting
  const formatResult = (num: number): string => {
    if (isNaN(num)) return "Error";
    if (!isFinite(num)) return "Infinity";
    
    // limit decimal representation to 12 digits
    const fixed = num.toFixed(12);
    // Parse back to float to remove trailing zeros
    const result = parseFloat(fixed);
    
    // Handle very large/small numbers in scientific notation
    if (Math.abs(result) > 1e15 || (Math.abs(result) < 1e-12 && result !== 0)) {
      return result.toExponential(8);
    }
    
    return result.toString();
  };

  const handleNumber = (num: string) => {
    if (display === "0" || shouldReset) {
      setDisplay(num);
      setShouldReset(false);
    } else {
      // Limit number of input digits to 16
      if (display.replace(/[^0-9]/g, "").length < 16) {
        setDisplay(display + num);
      }
    }
  };

  const handleDecimal = () => {
    if (shouldReset) {
      setDisplay("0.");
      setShouldReset(false);
      return;
    }
    if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const handleBackspace = () => {
    if (shouldReset) return;
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setExpression("");
    setPrevVal(null);
    setActiveOp(null);
    setShouldReset(false);
  };

  const handleClearEntry = () => {
    setDisplay("0");
  };

  const handleOperator = (op: string) => {
    const current = parseFloat(display);

    if (activeOp && prevVal !== null && !shouldReset) {
      const result = calculate(prevVal, current, activeOp);
      setPrevVal(result);
      setDisplay(formatResult(result));
      setExpression(`${formatResult(result)} ${op}`);
    } else {
      setPrevVal(current);
      setExpression(`${display} ${op}`);
    }
    setActiveOp(op);
    setShouldReset(true);
  };

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b === 0 ? NaN : a / b;
      default: return b;
    }
  };

  const handleEquals = () => {
    if (activeOp === null || prevVal === null || shouldReset) return;
    
    const current = parseFloat(display);
    const result = calculate(prevVal, current, activeOp);
    
    const fullExpr = `${expression} ${display} =`;
    const formattedRes = formatResult(result);
    
    setDisplay(formattedRes);
    setExpression("");
    setPrevVal(null);
    setActiveOp(null);
    setShouldReset(true);
    
    // Add to history
    if (!isNaN(result)) {
      setHistory(prev => [
        { id: Math.random().toString(), expression: fullExpr, result: formattedRes },
        ...prev
      ]);
    }
  };

  const handlePercent = () => {
    const current = parseFloat(display);
    if (prevVal !== null && activeOp) {
      // In Win 11: 50 + 10% = 50 + 5. The percentage is relative to prevVal.
      const pctValue = prevVal * (current / 100);
      setDisplay(formatResult(pctValue));
    } else {
      setDisplay(formatResult(current / 100));
    }
  };

  // Unary functions
  const handleReciprocal = () => {
    const current = parseFloat(display);
    if (current === 0) {
      setDisplay("Cannot divide by zero");
      setShouldReset(true);
      return;
    }
    setExpression(`1/(${display})`);
    setDisplay(formatResult(1 / current));
    setShouldReset(true);
  };

  const handleSquare = () => {
    const current = parseFloat(display);
    setExpression(`sqr(${display})`);
    setDisplay(formatResult(current * current));
    setShouldReset(true);
  };

  const handleSqrt = () => {
    const current = parseFloat(display);
    if (current < 0) {
      setDisplay("Invalid input");
      setShouldReset(true);
      return;
    }
    setExpression(`√(${display})`);
    setDisplay(formatResult(Math.sqrt(current)));
    setShouldReset(true);
  };

  const handleNegate = () => {
    const current = parseFloat(display);
    setDisplay(formatResult(current * -1));
  };

  // Memory Functions
  const handleMemoryStore = () => {
    const current = parseFloat(display);
    if (!isNaN(current)) {
      setMemory(prev => [current, ...prev]);
      setShouldReset(true);
    }
  };

  const handleMemoryRecall = () => {
    if (memory.length > 0) {
      setDisplay(formatResult(memory[0]));
      setShouldReset(true);
    }
  };

  const handleMemoryClear = () => {
    setMemory([]);
  };

  const handleMemoryAdd = () => {
    const current = parseFloat(display);
    if (!isNaN(current) && memory.length > 0) {
      const updated = [...memory];
      updated[0] = updated[0] + current;
      setMemory(updated);
      setShouldReset(true);
    } else if (memory.length === 0) {
      setMemory([current]);
      setShouldReset(true);
    }
  };

  const handleMemorySubtract = () => {
    const current = parseFloat(display);
    if (!isNaN(current) && memory.length > 0) {
      const updated = [...memory];
      updated[0] = updated[0] - current;
      setMemory(updated);
      setShouldReset(true);
    } else if (memory.length === 0) {
      setMemory([-current]);
      setShouldReset(true);
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setDisplay(item.result);
    setShouldReset(true);
  };

  const handleSelectMemoryItem = (val: number) => {
    setDisplay(formatResult(val));
    setShouldReset(true);
  };

  return (
    <div style={styles.outerContainer}>
      <div style={styles.calculatorPanel}>
        {/* Expression Display */}
        <div style={styles.expressionContainer}>
          {expression}
        </div>
        
        {/* Main Value Display */}
        <div style={styles.displayContainer}>
          {display}
        </div>

        {/* Memory Bar */}
        <div style={styles.memoryBar}>
          <button style={{ ...styles.memoryBtn, opacity: memory.length > 0 ? 1 : 0.4 }} onClick={handleMemoryClear}>MC</button>
          <button style={{ ...styles.memoryBtn, opacity: memory.length > 0 ? 1 : 0.4 }} onClick={handleMemoryRecall}>MR</button>
          <button style={styles.memoryBtn} onClick={handleMemoryAdd}>M+</button>
          <button style={styles.memoryBtn} onClick={handleMemorySubtract}>M-</button>
          <button style={styles.memoryBtn} onClick={handleMemoryStore}>MS</button>
          <button style={styles.memoryBtn} onClick={() => { setIsHistoryOpen(true); setActiveTab("memory"); }}>Mv</button>
        </div>

        {/* Keypad Grid */}
        <div style={styles.keypad}>
          <button className="fluent-btn op-key" onClick={handlePercent}>%</button>
          <button className="fluent-btn op-key" onClick={handleClearEntry}>CE</button>
          <button className="fluent-btn op-key" onClick={handleClear}>C</button>
          <button className="fluent-btn op-key" onClick={handleBackspace}>⌫</button>

          <button className="fluent-btn op-key" onClick={handleReciprocal}>¹/x</button>
          <button className="fluent-btn op-key" onClick={handleSquare}>x²</button>
          <button className="fluent-btn op-key" onClick={handleSqrt}>²√x</button>
          <button className="fluent-btn op-key" onClick={() => handleOperator("÷")}>÷</button>

          <button className="fluent-btn num-key" onClick={() => handleNumber("7")}>7</button>
          <button className="fluent-btn num-key" onClick={() => handleNumber("8")}>8</button>
          <button className="fluent-btn num-key" onClick={() => handleNumber("9")}>9</button>
          <button className="fluent-btn op-key" onClick={() => handleOperator("×")}>×</button>

          <button className="fluent-btn num-key" onClick={() => handleNumber("4")}>4</button>
          <button className="fluent-btn num-key" onClick={() => handleNumber("5")}>5</button>
          <button className="fluent-btn num-key" onClick={() => handleNumber("6")}>6</button>
          <button className="fluent-btn op-key" onClick={() => handleOperator("-")}>-</button>

          <button className="fluent-btn num-key" onClick={() => handleNumber("1")}>1</button>
          <button className="fluent-btn num-key" onClick={() => handleNumber("2")}>2</button>
          <button className="fluent-btn num-key" onClick={() => handleNumber("3")}>3</button>
          <button className="fluent-btn op-key" onClick={() => handleOperator("+")}>+</button>

          <button className="fluent-btn num-key" onClick={handleNegate}>+/-</button>
          <button className="fluent-btn num-key" onClick={() => handleNumber("0")}>0</button>
          <button className="fluent-btn num-key" onClick={handleDecimal}>.</button>
          <button className="fluent-btn accent-key" onClick={handleEquals}>=</button>
        </div>
      </div>

      {/* History and Memory Panel (Right Sidebar) */}
      <div style={{
        ...styles.historySidebar,
        display: isHistoryOpen ? "flex" : "none"
      }}>
        <div style={styles.historyTabs}>
          <button 
            style={{
              ...styles.tabBtn,
              borderBottom: activeTab === "history" ? "3px solid var(--text-accent)" : "none",
              fontWeight: activeTab === "history" ? 600 : 400
            }}
            onClick={() => setActiveTab("history")}
          >
            History
          </button>
          <button 
            style={{
              ...styles.tabBtn,
              borderBottom: activeTab === "memory" ? "3px solid var(--text-accent)" : "none",
              fontWeight: activeTab === "memory" ? 600 : 400
            }}
            onClick={() => setActiveTab("memory")}
          >
            Memory
          </button>
        </div>

        <div style={styles.historyContent}>
          {activeTab === "history" ? (
            history.length === 0 ? (
              <div style={styles.emptyText}>There's no history yet</div>
            ) : (
              <div style={styles.historyList}>
                {history.map((item) => (
                  <div 
                    key={item.id} 
                    style={styles.historyItem}
                    onClick={() => handleSelectHistoryItem(item)}
                  >
                    <div style={styles.historyExpr}>{item.expression}</div>
                    <div style={styles.historyRes}>{item.result}</div>
                  </div>
                ))}
              </div>
            )
          ) : (
            memory.length === 0 ? (
              <div style={styles.emptyText}>There's nothing saved in memory</div>
            ) : (
              <div style={styles.historyList}>
                {memory.map((val, idx) => (
                  <div 
                    key={idx} 
                    style={styles.memoryItem}
                    onClick={() => handleSelectMemoryItem(val)}
                  >
                    <div style={styles.memoryVal}>{val}</div>
                    <div style={styles.memoryRowActions}>
                      <button style={styles.memoryActionBtn} onClick={(e) => { e.stopPropagation(); setMemory(memory.filter((_, i) => i !== idx)); }}>MC</button>
                      <button style={styles.memoryActionBtn} onClick={(e) => { e.stopPropagation(); const m = [...memory]; m[idx] += parseFloat(display); setMemory(m); }}>M+</button>
                      <button style={styles.memoryActionBtn} onClick={(e) => { e.stopPropagation(); const m = [...memory]; m[idx] -= parseFloat(display); setMemory(m); }}>M-</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        <div style={styles.historyFooter}>
          {activeTab === "history" && history.length > 0 && (
            <button style={styles.clearBtn} onClick={() => setHistory([])} aria-label="Clear history">
              <Trash2 size={16} />
            </button>
          )}
          {activeTab === "memory" && memory.length > 0 && (
            <button style={styles.clearBtn} onClick={() => setMemory([])} aria-label="Clear memory">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  outerContainer: {
    display: "flex",
    flex: 1,
    height: "100%",
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  calculatorPanel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    padding: "0 12px 12px 12px",
    height: "100%",
  },
  expressionContainer: {
    minHeight: "24px",
    fontSize: "14px",
    color: "var(--text-sec)",
    textAlign: "right",
    padding: "4px 8px",
    wordBreak: "break-all",
  },
  displayContainer: {
    fontSize: "46px",
    fontWeight: "600",
    color: "var(--text-main)",
    textAlign: "right",
    padding: "0 8px 8px 8px",
    wordBreak: "break-all",
    flex: 0.3,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    maxHeight: "120px",
    overflow: "hidden",
  },
  memoryBar: {
    display: "flex",
    gap: "4px",
    marginBottom: "8px",
  },
  memoryBtn: {
    flex: 1,
    background: "transparent",
    border: "none",
    color: "var(--text-main)",
    fontSize: "12px",
    fontWeight: 600,
    height: "28px",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.1s ease",
  },
  keypad: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gridTemplateRows: "repeat(6, 1fr)",
    gap: "2px",
  },
  historySidebar: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "280px",
    borderLeft: "1px solid var(--border-app)",
    backgroundColor: "var(--bg-sidebar)",
    backdropFilter: "var(--mica-blur)",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    zIndex: 5,
    animation: "slideInRight 0.2s cubic-bezier(0.1, 0.9, 0.2, 1)",
    boxShadow: "var(--card-shadow)",
  },
  historyTabs: {
    display: "flex",
    padding: "8px 12px 0 12px",
    gap: "16px",
  },
  tabBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-main)",
    padding: "6px 0",
    cursor: "pointer",
    fontSize: "14px",
  },
  historyContent: {
    flex: 1,
    overflowY: "auto",
    padding: "12px",
  },
  emptyText: {
    fontSize: "13px",
    color: "var(--text-sec)",
    textAlign: "left",
    padding: "8px 0",
  },
  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  historyItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    cursor: "pointer",
    padding: "6px",
    borderRadius: "4px",
    transition: "background-color 0.1s",
  },
  historyExpr: {
    fontSize: "12px",
    color: "var(--text-sec)",
  },
  historyRes: {
    fontSize: "20px",
    fontWeight: 600,
    color: "var(--text-main)",
  },
  memoryItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid var(--border-subtle)",
    backgroundColor: "var(--bg-btn-op)",
  },
  memoryVal: {
    fontSize: "18px",
    fontWeight: 600,
    color: "var(--text-main)",
  },
  memoryRowActions: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
  },
  memoryActionBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-sec)",
    fontSize: "11px",
    cursor: "pointer",
  },
  historyFooter: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "8px 12px",
  },
  clearBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-main)",
    padding: "8px",
    borderRadius: "4px",
    cursor: "pointer",
  },
};
