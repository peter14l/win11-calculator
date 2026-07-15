import React, { useState } from "react";

interface ScientificCalculatorProps {
  isHistoryOpen?: boolean;
  setIsHistoryOpen?: (open: boolean) => void;
}

type AngleMode = "DEG" | "RAD" | "GRAD";

export const ScientificCalculator: React.FC<ScientificCalculatorProps> = () => {
  const [display, setDisplay] = useState("0");
  const [expression, setExpression] = useState("");
  const [prevVal, setPrevVal] = useState<number | null>(null);
  const [activeOp, setActiveOp] = useState<string | null>(null);
  const [shouldReset, setShouldReset] = useState(false);
  const [angleMode, setAngleMode] = useState<AngleMode>("DEG");
  const [isSecondActive, setIsSecondActive] = useState(false);
  const [memory, setMemory] = useState<number[]>([]);

  // Clean float formatting
  const formatResult = (num: number): string => {
    if (isNaN(num)) return "Error";
    if (!isFinite(num)) return "Infinity";
    const fixed = num.toFixed(12);
    const result = parseFloat(fixed);
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

  // Convert to Radians for calculation
  const toRadians = (val: number): number => {
    switch (angleMode) {
      case "DEG": return (val * Math.PI) / 180;
      case "GRAD": return (val * Math.PI) / 200;
      case "RAD": return val;
    }
  };

  // Convert from Radians to selected mode
  const fromRadians = (val: number): number => {
    switch (angleMode) {
      case "DEG": return (val * 180) / Math.PI;
      case "GRAD": return (val * 200) / Math.PI;
      case "RAD": return val;
    }
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
      case "x^y": return Math.pow(a, b);
      case "y√x": return Math.pow(a, 1 / b);
      case "mod": return a % b;
      default: return b;
    }
  };

  const handleEquals = () => {
    if (activeOp === null || prevVal === null || shouldReset) return;
    const current = parseFloat(display);
    const result = calculate(prevVal, current, activeOp);
    
    setDisplay(formatResult(result));
    setExpression("");
    setPrevVal(null);
    setActiveOp(null);
    setShouldReset(true);
  };

  // Factorial utility
  const factorial = (n: number): number => {
    if (n < 0 || !Number.isInteger(n)) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
      if (result === Infinity) return Infinity;
    }
    return result;
  };

  // Scientific function applications
  const applyFunc = (funcName: string) => {
    const current = parseFloat(display);
    let result = 0;
    let label = `${funcName}(${display})`;

    switch (funcName) {
      case "sin":
        result = Math.sin(toRadians(current));
        break;
      case "cos":
        result = Math.cos(toRadians(current));
        break;
      case "tan":
        result = Math.tan(toRadians(current));
        break;
      case "asin":
        result = fromRadians(Math.asin(current));
        break;
      case "acos":
        result = fromRadians(Math.acos(current));
        break;
      case "atan":
        result = fromRadians(Math.atan(current));
        break;
      case "sinh":
        result = Math.sinh(current);
        break;
      case "cosh":
        result = Math.cosh(current);
        break;
      case "tanh":
        result = Math.tanh(current);
        break;
      case "ln":
        result = Math.log(current);
        break;
      case "log":
        result = Math.log10(current);
        break;
      case "1/x":
        result = 1 / current;
        label = `1/(${display})`;
        break;
      case "x^2":
        result = current * current;
        label = `sqr(${display})`;
        break;
      case "x^3":
        result = current * current * current;
        label = `cube(${display})`;
        break;
      case "sqrt":
        result = Math.sqrt(current);
        label = `√(${display})`;
        break;
      case "10^x":
        result = Math.pow(10, current);
        label = `10^(${display})`;
        break;
      case "e^x":
        result = Math.exp(current);
        label = `e^(${display})`;
        break;
      case "abs":
        result = Math.abs(current);
        label = `abs(${display})`;
        break;
      case "fact":
        result = factorial(current);
        label = `${display}!`;
        break;
      case "neg":
        result = -current;
        label = `negate(${display})`;
        break;
      default:
        return;
    }

    setExpression(label);
    setDisplay(formatResult(result));
    setShouldReset(true);
  };

  const handleConstant = (type: "pi" | "e") => {
    const val = type === "pi" ? Math.PI : Math.E;
    setDisplay(formatResult(val));
    setShouldReset(false);
  };

  // Memory operations
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

  const toggleAngleMode = () => {
    if (angleMode === "DEG") setAngleMode("RAD");
    else if (angleMode === "RAD") setAngleMode("GRAD");
    else setAngleMode("DEG");
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

        {/* Scientific Configuration Bar */}
        <div style={styles.configBar}>
          <button style={styles.configBtn} onClick={toggleAngleMode}>
            {angleMode}
          </button>
          <button 
            style={{
              ...styles.configBtn,
              backgroundColor: isSecondActive ? "var(--bg-btn-active)" : "transparent"
            }} 
            onClick={() => setIsSecondActive(!isSecondActive)}
          >
            2nd
          </button>
          <button style={styles.configBtn} onClick={() => handleConstant("pi")}>π</button>
          <button style={styles.configBtn} onClick={() => handleConstant("e")}>e</button>
        </div>

        {/* Memory Bar */}
        <div style={styles.memoryBar}>
          <button style={{ ...styles.memoryBtn, opacity: memory.length > 0 ? 1 : 0.4 }} onClick={handleMemoryClear}>MC</button>
          <button style={{ ...styles.memoryBtn, opacity: memory.length > 0 ? 1 : 0.4 }} onClick={handleMemoryRecall}>MR</button>
          <button style={styles.memoryBtn} onClick={handleMemoryAdd}>M+</button>
          <button style={styles.memoryBtn} onClick={handleMemorySubtract}>M-</button>
          <button style={styles.memoryBtn} onClick={handleMemoryStore}>MS</button>
        </div>

        {/* Keypad Grid (5 columns, 7 rows) */}
        <div style={styles.keypad}>
          {/* Row 1 */}
          <button className="fluent-btn op-key" onClick={() => applyFunc(isSecondActive ? "asin" : "sin")}>
            {isSecondActive ? "sin⁻¹" : "sin"}
          </button>
          <button className="fluent-btn op-key" onClick={() => applyFunc(isSecondActive ? "acos" : "cos")}>
            {isSecondActive ? "cos⁻¹" : "cos"}
          </button>
          <button className="fluent-btn op-key" onClick={() => applyFunc(isSecondActive ? "atan" : "tan")}>
            {isSecondActive ? "tan⁻¹" : "tan"}
          </button>
          <button className="fluent-btn op-key" onClick={() => applyFunc("x^2")}>x²</button>
          <button className="fluent-btn op-key" onClick={handleClear}>C</button>

          {/* Row 2 */}
          <button className="fluent-btn op-key" onClick={() => applyFunc("sinh")}>sinh</button>
          <button className="fluent-btn op-key" onClick={() => applyFunc("cosh")}>cosh</button>
          <button className="fluent-btn op-key" onClick={() => applyFunc("tanh")}>tanh</button>
          <button className="fluent-btn op-key" onClick={() => applyFunc("x^3")}>x³</button>
          <button className="fluent-btn op-key" onClick={handleBackspace}>⌫</button>

          {/* Row 3 */}
          <button className="fluent-btn op-key" onClick={() => applyFunc(isSecondActive ? "e^x" : "ln")}>
            {isSecondActive ? "eˣ" : "ln"}
          </button>
          <button className="fluent-btn op-key" onClick={() => applyFunc(isSecondActive ? "10^x" : "log")}>
            {isSecondActive ? "10ˣ" : "log"}
          </button>
          <button className="fluent-btn op-key" onClick={() => applyFunc("1/x")}>¹/x</button>
          <button className="fluent-btn op-key" onClick={() => handleOperator("x^y")}>xʸ</button>
          <button className="fluent-btn op-key" onClick={() => handleOperator("mod")}>mod</button>

          {/* Row 4 */}
          <button className="fluent-btn op-key" onClick={() => applyFunc("sqrt")}>√</button>
          <button className="fluent-btn op-key" onClick={() => handleOperator("y√x")}>ʸ√x</button>
          <button className="fluent-btn op-key" onClick={() => applyFunc("abs")}>|x|</button>
          <button className="fluent-btn op-key" onClick={() => applyFunc("fact")}>n!</button>
          <button className="fluent-btn op-key" onClick={() => handleOperator("÷")}>÷</button>

          {/* Row 5 */}
          <button className="fluent-btn op-key" onClick={() => applyFunc("neg")}>+/-</button>
          <button className="fluent-btn num-key" onClick={() => handleNumber("7")}>7</button>
          <button className="fluent-btn num-key" onClick={() => handleNumber("8")}>8</button>
          <button className="fluent-btn num-key" onClick={() => handleNumber("9")}>9</button>
          <button className="fluent-btn op-key" onClick={() => handleOperator("×")}>×</button>

          {/* Row 6 */}
          <button className="fluent-btn op-key" onClick={() => handleNumber("e")}>e</button>
          <button className="fluent-btn num-key" onClick={() => handleNumber("4")}>4</button>
          <button className="fluent-btn num-key" onClick={() => handleNumber("5")}>5</button>
          <button className="fluent-btn num-key" onClick={() => handleNumber("6")}>6</button>
          <button className="fluent-btn op-key" onClick={() => handleOperator("-")}>-</button>

          {/* Row 7 */}
          <button className="fluent-btn op-key" onClick={() => handleNumber("3.14159265")}>π</button>
          <button className="fluent-btn num-key" onClick={() => handleNumber("1")}>1</button>
          <button className="fluent-btn num-key" onClick={() => handleNumber("2")}>2</button>
          <button className="fluent-btn num-key" onClick={() => handleNumber("3")}>3</button>
          <button className="fluent-btn op-key" onClick={() => handleOperator("+")}>+</button>

          {/* Row 8 */}
          <button className="fluent-btn op-key" style={{ gridColumn: "span 2" }} onClick={() => handleNumber("0")}>0</button>
          <button className="fluent-btn num-key" onClick={handleDecimal}>.</button>
          <button className="fluent-btn accent-key" style={{ gridColumn: "span 2" }} onClick={handleEquals}>=</button>
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
  configBar: {
    display: "flex",
    gap: "8px",
    marginBottom: "4px",
  },
  configBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-main)",
    fontSize: "12px",
    fontWeight: 600,
    height: "28px",
    padding: "0 8px",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.1s ease",
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
    gridTemplateColumns: "repeat(5, 1fr)",
    gridTemplateRows: "repeat(8, 1fr)",
    gap: "2px",
  },
};
