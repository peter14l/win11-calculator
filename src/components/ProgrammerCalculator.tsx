import type React from "react";
import { useState } from "react";
import {
  formatString,
  parseString,
  truncateToWordSize,
  getBitWidth,
  bitwiseAnd,
  bitwiseOr,
  bitwiseXor,
  bitwiseNot,
  shiftLeft,
  shiftRight,
} from "../utils/programmerMath";
import type { WordSize } from "../utils/programmerMath";
import { useCalculatorKeyboard } from "../hooks/useCalculatorKeyboard";

interface ProgrammerProps {
  grouping: boolean;
}

const groupThousands = (s: string): string => {
  const m = /^-?\d+$/.exec(s);
  if (!m) return s;
  const neg = s.startsWith("-");
  const digits = neg ? s.slice(1) : s;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (neg ? "-" : "") + grouped;
};

const toDisplay = (v: bigint, base: number, wordSize: WordSize, isSigned: boolean, grouping: boolean): string => {
  const raw = formatString(v, base, wordSize, base === 10 && isSigned);
  return base === 10 && grouping ? groupThousands(raw) : raw;
};

export const ProgrammerCalculator: React.FC<ProgrammerProps> = ({ grouping }) => {
  const [value, setValue] = useState<bigint>(0n);
  const [activeBase, setActiveBase] = useState<number>(10);
  const [wordSize, setWordSize] = useState<WordSize>("QWORD");
  const [expression, setExpression] = useState("");
  const [prevVal, setPrevVal] = useState<bigint | null>(null);
  const [activeOp, setActiveOp] = useState<string | null>(null);
  const [shouldReset, setShouldReset] = useState(false);
  const [isSigned, setIsSigned] = useState(true);
  const [showBits, setShowBits] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isKeyActive = (char: string): boolean => {
    const c = char.toUpperCase();
    const val = /[0-9]/.test(c)
      ? parseInt(c, 10)
      : /[A-F]/.test(c)
        ? 10 + c.charCodeAt(0) - 65
        : NaN;
    return Number.isNaN(val) ? true : val < activeBase;
  };

  const handleNumber = (char: string) => {
    const c = char.toUpperCase();
    if (!isKeyActive(c)) return;
    setError(null);
    if (shouldReset) {
      setValue(parseString(c, activeBase, wordSize));
      setShouldReset(false);
      return;
    }
    const display = formatString(value, activeBase, wordSize, false).replace(/\s+/g, "");
    setValue(parseString(display + c, activeBase, wordSize));
  };

  const handleBackspace = () => {
    setError(null);
    if (shouldReset) return;
    const display = formatString(value, activeBase, wordSize, activeBase === 10 && isSigned).replace(/\s+/g, "");
    const next = display.slice(0, -1);
    setValue(parseString(next || "0", activeBase, wordSize));
  };

  const handleClear = () => {
    setValue(0n);
    setExpression("");
    setPrevVal(null);
    setActiveOp(null);
    setShouldReset(false);
    setError(null);
  };

  const handleClearEntry = () => {
    setValue(0n);
    setError(null);
  };

  const calculate = (a: bigint, b: bigint, op: string): bigint | null => {
    switch (op) {
      case "+": return truncateToWordSize(a + b, wordSize);
      case "-": return truncateToWordSize(a - b, wordSize);
      case "×": return truncateToWordSize(a * b, wordSize);
      case "÷":
      case "mod":
        if (b === 0n) return null;
        return truncateToWordSize(a / b, wordSize);
      case "AND": return bitwiseAnd(a, b, wordSize);
      case "OR": return bitwiseOr(a, b, wordSize);
      case "XOR": return bitwiseXor(a, b, wordSize);
      case "LSH": return shiftLeft(a, b, wordSize);
      case "RSH": return shiftRight(a, b, wordSize, isSigned);
      default: return b;
    }
  };

  const handleOperator = (op: string) => {
    if (activeOp && prevVal !== null && !shouldReset) {
      const result = calculate(prevVal, value, activeOp);
      if (result === null) {
        setError("Cannot divide by zero");
        setExpression("");
        setPrevVal(null);
        setActiveOp(null);
        setShouldReset(true);
        return;
      }
      setPrevVal(result);
      setValue(result);
      setExpression(`${toDisplay(result, activeBase, wordSize, isSigned, grouping)} ${op}`);
    } else {
      setPrevVal(value);
      setExpression(`${toDisplay(value, activeBase, wordSize, isSigned, grouping)} ${op}`);
    }
    setActiveOp(op);
    setShouldReset(true);
  };

  const handleEquals = () => {
    if (activeOp === null || prevVal === null || shouldReset) return;
    const result = calculate(prevVal, value, activeOp);
    setExpression("");
    setPrevVal(null);
    setActiveOp(null);
    setShouldReset(true);
    setValue(result === null ? 0n : result);
    setError(result === null ? "Cannot divide by zero" : null);
  };

  const handleNegate = () => {
    setError(null);
    setValue(truncateToWordSize(-value, wordSize));
  };

  const handleNot = () => {
    setError(null);
    setValue(bitwiseNot(value, wordSize));
    setShouldReset(true);
  };

  const handleMod = () => handleOperator("mod");

  const toggleBit = (bitIndex: number) => {
    setError(null);
    setValue(truncateToWordSize(value ^ (1n << BigInt(bitIndex)), wordSize));
  };

  const changeWordSize = () => {
    const sizes: WordSize[] = ["QWORD", "DWORD", "WORD", "BYTE"];
    const nextIdx = (sizes.indexOf(wordSize) + 1) % sizes.length;
    const nextSize = sizes[nextIdx];
    setWordSize(nextSize);
    setValue(truncateToWordSize(value, nextSize));
  };

  useCalculatorKeyboard(true, {
    digit: (d) => handleNumber(d),
    decimal: () => {},
    op: (op) => handleOperator(op),
    equals: handleEquals,
    backspace: handleBackspace,
    clear: handleClear,
    clearEntry: handleClearEntry,
    percent: handleMod,
    letter: (c) => handleNumber(c),
  });

  const renderBitGrid = () => {
    const bitWidth = Number(getBitWidth(wordSize));
    const bits: React.ReactNode[] = [];
    for (let i = bitWidth - 1; i >= 0; i--) {
      const bitIsSet = (value & (1n << BigInt(i))) !== 0n;
      bits.push(
        <div
          key={i}
          style={{
            ...styles.bitCell,
            backgroundColor: bitIsSet ? "var(--text-accent)" : "rgba(255,255,255,0.05)",
            color: bitIsSet ? "#000" : "var(--text-main)",
            borderColor: bitIsSet ? "var(--text-accent)" : "var(--border-subtle)",
          }}
          onClick={() => toggleBit(i)}
        >
          <div style={styles.bitIndex}>{i}</div>
          <div style={styles.bitValue}>{bitIsSet ? "1" : "0"}</div>
        </div>
      );
    }
    return bits;
  };

  const hexKey = (c: string) =>
    `fluent-btn op-key ${isKeyActive(c) ? "" : "disabled"}`;
  const numKey = (c: string) =>
    `fluent-btn num-key ${isKeyActive(c) ? "" : "disabled"}`;

  return (
    <div style={styles.container}>
      <div style={styles.basesPanel}>
        <div
          style={{ ...styles.baseRow, color: activeBase === 16 ? "var(--text-accent)" : "var(--text-main)" }}
          onClick={() => setActiveBase(16)}
        >
          <span style={styles.baseLabel}>HEX</span>
          <span style={styles.baseVal}>{formatString(value, 16, wordSize, false)}</span>
        </div>
        <div
          style={{ ...styles.baseRow, color: activeBase === 10 ? "var(--text-accent)" : "var(--text-main)" }}
          onClick={() => setActiveBase(10)}
        >
          <span style={styles.baseLabel}>DEC</span>
          <span style={styles.baseVal}>{toDisplay(value, 10, wordSize, isSigned, grouping)}</span>
        </div>
        <div
          style={{ ...styles.baseRow, color: activeBase === 8 ? "var(--text-accent)" : "var(--text-main)" }}
          onClick={() => setActiveBase(8)}
        >
          <span style={styles.baseLabel}>OCT</span>
          <span style={styles.baseVal}>{formatString(value, 8, wordSize, false)}</span>
        </div>
        <div
          style={{ ...styles.baseRow, color: activeBase === 2 ? "var(--text-accent)" : "var(--text-main)" }}
          onClick={() => setActiveBase(2)}
        >
          <span style={styles.baseLabel}>BIN</span>
          <span style={styles.baseVal}>{formatString(value, 2, wordSize, false)}</span>
        </div>
      </div>

      <div style={styles.displayArea}>
        <div style={styles.expression}>{expression}</div>
        <div style={styles.mainVal}>
          {error ?? toDisplay(value, activeBase, wordSize, isSigned, grouping)}
        </div>
      </div>

      <div style={styles.controlBar}>
        <button className="chip-btn" style={{ borderLeft: "2px solid var(--text-accent)" }} onClick={changeWordSize}>
          {wordSize}
        </button>
        <button
          className="chip-btn"
          style={{ backgroundColor: showBits ? "var(--bg-btn-active)" : undefined }}
          onClick={() => setShowBits(!showBits)}
        >
          Bit Visualizer
        </button>
        {activeBase === 10 && (
          <button className="chip-btn" onClick={() => setIsSigned(!isSigned)}>
            {isSigned ? "Signed" : "Unsigned"}
          </button>
        )}
      </div>

      {showBits && <div style={styles.bitVisualizer}>{renderBitGrid()}</div>}

      <div style={{ ...styles.keypad, flex: showBits ? 0.7 : 1.2 }}>
        <button className={hexKey("A")} onClick={() => handleNumber("A")}>A</button>
        <button className="fluent-btn op-key" onClick={() => handleOperator("LSH")}>Lsh</button>
        <button className="fluent-btn op-key" onClick={() => handleOperator("RSH")}>Rsh</button>
        <button className="fluent-btn op-key" onClick={handleClearEntry}>CE</button>
        <button className="fluent-btn op-key" onClick={handleClear}>C</button>
        <button className="fluent-btn op-key" onClick={handleBackspace}>⌫</button>

        <button className={hexKey("B")} onClick={() => handleNumber("B")}>B</button>
        <button className="fluent-btn op-key" onClick={() => handleOperator("AND")}>AND</button>
        <button className="fluent-btn op-key" onClick={() => handleOperator("OR")}>OR</button>
        <button className="fluent-btn op-key" onClick={() => handleOperator("XOR")}>XOR</button>
        <button className="fluent-btn op-key" onClick={handleNot}>NOT</button>
        <button className="fluent-btn op-key" onClick={() => handleOperator("÷")}>÷</button>

        <button className={hexKey("C")} onClick={() => handleNumber("C")}>C</button>
        <button className={numKey("7")} onClick={() => handleNumber("7")}>7</button>
        <button className={numKey("8")} onClick={() => handleNumber("8")}>8</button>
        <button className={numKey("9")} onClick={() => handleNumber("9")}>9</button>
        <button className="fluent-btn op-key" onClick={handleNegate}>+/-</button>
        <button className="fluent-btn op-key" onClick={() => handleOperator("×")}>×</button>

        <button className={hexKey("D")} onClick={() => handleNumber("D")}>D</button>
        <button className={numKey("4")} onClick={() => handleNumber("4")}>4</button>
        <button className={numKey("5")} onClick={() => handleNumber("5")}>5</button>
        <button className={numKey("6")} onClick={() => handleNumber("6")}>6</button>
        <button className="fluent-btn op-key" style={{ gridColumn: "span 2" }} onClick={() => handleOperator("-")}>-</button>

        <button className={hexKey("E")} onClick={() => handleNumber("E")}>E</button>
        <button className={numKey("1")} onClick={() => handleNumber("1")}>1</button>
        <button className={numKey("2")} onClick={() => handleNumber("2")}>2</button>
        <button className={numKey("3")} onClick={() => handleNumber("3")}>3</button>
        <button className="fluent-btn op-key" style={{ gridColumn: "span 2" }} onClick={() => handleOperator("+")}>+</button>

        <button className={hexKey("F")} onClick={() => handleNumber("F")}>F</button>
        <button className="fluent-btn op-key" onClick={handleMod}>mod</button>
        <button className="fluent-btn num-key" style={{ gridColumn: "span 2" }} onClick={() => handleNumber("0")}>0</button>
        <button className="fluent-btn accent-key" style={{ gridColumn: "span 2" }} onClick={handleEquals}>=</button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    padding: "0 12px 12px 12px",
    flex: 1,
    overflow: "hidden",
  },
  basesPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    padding: "4px 8px",
    backgroundColor: "var(--bg-btn-op)",
    borderRadius: "4px",
    marginBottom: "8px",
  },
  baseRow: {
    display: "flex",
    cursor: "pointer",
    fontSize: "13px",
    alignItems: "center",
    gap: "12px",
    padding: "2px 4px",
    transition: "color 0.15s ease",
  },
  baseLabel: {
    fontWeight: "bold",
    minWidth: "36px",
  },
  baseVal: {
    fontFamily: "monospace",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  displayArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    flex: 0.2,
    minHeight: "70px",
    padding: "4px 8px",
  },
  expression: {
    fontSize: "13px",
    color: "var(--text-sec)",
  },
  mainVal: {
    fontSize: "36px",
    fontWeight: "600",
    wordBreak: "break-all",
  },
  controlBar: {
    display: "flex",
    gap: "8px",
    margin: "4px 0",
  },
  bitVisualizer: {
    display: "grid",
    gridTemplateColumns: "repeat(8, 1fr)",
    gap: "4px",
    padding: "8px",
    backgroundColor: "var(--bg-btn-op)",
    borderRadius: "4px",
    maxHeight: "130px",
    overflowY: "auto",
    marginBottom: "8px",
  },
  bitCell: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px",
    borderRadius: "2px",
    cursor: "pointer",
    border: "1px solid transparent",
    transition: "all 0.1s ease",
  },
  bitIndex: {
    fontSize: "8px",
    opacity: 0.7,
  },
  bitValue: {
    fontSize: "12px",
    fontWeight: "bold",
  },
  keypad: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gridTemplateRows: "repeat(6, 1fr)",
    gap: "2px",
  },
};