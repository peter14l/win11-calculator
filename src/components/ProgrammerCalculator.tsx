import React, { useState, useEffect } from "react";
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
  shiftRight 
} from "../utils/programmerMath";
import type { WordSize } from "../utils/programmerMath";

export const ProgrammerCalculator: React.FC = () => {
  const [value, setValue] = useState<bigint>(0n);
  const [activeBase, setActiveBase] = useState<number>(10);
  const [wordSize, setWordSize] = useState<WordSize>("QWORD");
  const [expression, setExpression] = useState("");
  const [prevVal, setPrevVal] = useState<bigint | null>(null);
  const [activeOp, setActiveOp] = useState<string | null>(null);
  const [shouldReset, setShouldReset] = useState(false);
  const [isSigned, setIsSigned] = useState(true);
  const [showBits, setShowBits] = useState(false); // Toggle to show the 64-bit visualizer

  // Generate input buffer
  const [inputBuffer, setInputBuffer] = useState("0");

  useEffect(() => {
    // Keep inputBuffer synchronized with value when value changes externally
    setInputBuffer(formatString(value, activeBase, wordSize, isSigned).replace(/\s+/g, ""));
  }, [value, activeBase, wordSize, isSigned]);

  const handleNumber = (char: string) => {
    let cleanChar = char.toUpperCase();
    if (shouldReset) {
      setInputBuffer(cleanChar);
      setValue(parseString(cleanChar, activeBase, wordSize));
      setShouldReset(false);
      return;
    }

    let nextBuffer = inputBuffer === "0" ? cleanChar : inputBuffer + cleanChar;
    // Basic verification: can parse
    const parsed = parseString(nextBuffer, activeBase, wordSize);
    setValue(parsed);
    setInputBuffer(nextBuffer);
  };

  const handleBackspace = () => {
    if (shouldReset) return;
    if (inputBuffer.length > 1) {
      const next = inputBuffer.slice(0, -1);
      setInputBuffer(next);
      setValue(parseString(next, activeBase, wordSize));
    } else {
      setInputBuffer("0");
      setValue(0n);
    }
  };

  const handleClear = () => {
    setValue(0n);
    setInputBuffer("0");
    setExpression("");
    setPrevVal(null);
    setActiveOp(null);
    setShouldReset(false);
  };

  const handleClearEntry = () => {
    setValue(0n);
    setInputBuffer("0");
  };

  const handleOperator = (op: string) => {
    if (activeOp && prevVal !== null && !shouldReset) {
      const result = calculate(prevVal, value, activeOp);
      setPrevVal(result);
      setValue(result);
      setExpression(`${formatString(result, activeBase, wordSize, isSigned)} ${op}`);
    } else {
      setPrevVal(value);
      setExpression(`${formatString(value, activeBase, wordSize, isSigned)} ${op}`);
    }
    setActiveOp(op);
    setShouldReset(true);
  };

  const calculate = (a: bigint, b: bigint, op: string): bigint => {
    switch (op) {
      case "+": return truncateToWordSize(a + b, wordSize);
      case "-": return truncateToWordSize(a - b, wordSize);
      case "×": return truncateToWordSize(a * b, wordSize);
      case "÷": return b === 0n ? 0n : truncateToWordSize(a / b, wordSize);
      case "AND": return bitwiseAnd(a, b, wordSize);
      case "OR": return bitwiseOr(a, b, wordSize);
      case "XOR": return bitwiseXor(a, b, wordSize);
      case "LSH": return shiftLeft(a, b, wordSize);
      case "RSH": return shiftRight(a, b, wordSize, isSigned);
      default: return b;
    }
  };

  const handleEquals = () => {
    if (activeOp === null || prevVal === null || shouldReset) return;
    const result = calculate(prevVal, value, activeOp);
    
    setValue(result);
    setExpression("");
    setPrevVal(null);
    setActiveOp(null);
    setShouldReset(true);
  };

  const handleNegate = () => {
    const negated = truncateToWordSize(-value, wordSize);
    setValue(negated);
  };

  const handleNot = () => {
    const negated = bitwiseNot(value, wordSize);
    setValue(negated);
    setShouldReset(true);
  };

  const toggleBit = (bitIndex: number) => {
    const bitVal = 1n << BigInt(bitIndex);
    const nextVal = value ^ bitVal;
    setValue(truncateToWordSize(nextVal, wordSize));
  };

  const changeWordSize = () => {
    const sizes: WordSize[] = ["QWORD", "DWORD", "WORD", "BYTE"];
    const nextIdx = (sizes.indexOf(wordSize) + 1) % sizes.length;
    const nextSize = sizes[nextIdx];
    setWordSize(nextSize);
    setValue(truncateToWordSize(value, nextSize));
  };

  // Check if keys are active in the selected base
  const isKeyActive = (char: string): boolean => {
    const c = char.toUpperCase();
    if (/[A-F]/.test(c)) return activeBase === 16;
    if (/[8-9]/.test(c)) return activeBase === 16 || activeBase === 10;
    if (/[2-7]/.test(c)) return activeBase === 16 || activeBase === 10 || activeBase === 8;
    if (/[0-1]/.test(c)) return true;
    return true;
  };

  // Render bit representations
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

  return (
    <div style={styles.container}>
      {/* Side-by-Side Bases Panel */}
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
          <span style={styles.baseVal}>{formatString(value, 10, wordSize, isSigned)}</span>
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

      {/* Main Expression / Display */}
      <div style={styles.displayArea}>
        <div style={styles.expression}>{expression}</div>
        <div style={styles.mainVal}>
          {formatString(value, activeBase, wordSize, activeBase === 10 ? isSigned : false)}
        </div>
      </div>

      {/* Control Bar (Word size & Bit view toggler) */}
      <div style={styles.controlBar}>
        <button style={styles.controlBtn} onClick={changeWordSize}>
          {wordSize}
        </button>
        <button 
          style={{
            ...styles.controlBtn,
            backgroundColor: showBits ? "var(--bg-btn-active)" : "transparent"
          }}
          onClick={() => setShowBits(!showBits)}
        >
          Bit Visualizer
        </button>
        {activeBase === 10 && (
          <button style={styles.controlBtn} onClick={() => setIsSigned(!isSigned)}>
            {isSigned ? "Signed" : "Unsigned"}
          </button>
        )}
      </div>

      {/* Bit Visualizer Grid */}
      {showBits && (
        <div style={styles.bitVisualizer}>
          {renderBitGrid()}
        </div>
      )}

      {/* Keypad Grid (6 columns, 6 rows) */}
      <div style={{ ...styles.keypad, flex: showBits ? 0.7 : 1.2 }}>
        {/* Row 1 */}
        <button className={`fluent-btn op-key ${isKeyActive("A") ? "" : "disabled"}`} onClick={() => handleNumber("A")}>A</button>
        <button className="fluent-btn op-key" onClick={() => handleOperator("LSH")}>Lsh</button>
        <button className="fluent-btn op-key" onClick={() => handleOperator("RSH")}>Rsh</button>
        <button className="fluent-btn op-key" onClick={handleClearEntry}>CE</button>
        <button className="fluent-btn op-key" onClick={handleClear}>C</button>
        <button className="fluent-btn op-key" onClick={handleBackspace}>⌫</button>

        {/* Row 2 */}
        <button className={`fluent-btn op-key ${isKeyActive("B") ? "" : "disabled"}`} onClick={() => handleNumber("B")}>B</button>
        <button className="fluent-btn op-key" onClick={() => handleOperator("AND")}>AND</button>
        <button className="fluent-btn op-key" onClick={() => handleOperator("OR")}>OR</button>
        <button className="fluent-btn op-key" onClick={() => handleOperator("XOR")}>XOR</button>
        <button className="fluent-btn op-key" onClick={handleNot}>NOT</button>
        <button className="fluent-btn op-key" onClick={() => handleOperator("÷")}>÷</button>

        {/* Row 3 */}
        <button className={`fluent-btn op-key ${isKeyActive("C") ? "" : "disabled"}`} onClick={() => handleNumber("C")}>C</button>
        <button className={`fluent-btn num-key ${isKeyActive("7") ? "" : "disabled"}`} onClick={() => handleNumber("7")}>7</button>
        <button className={`fluent-btn num-key ${isKeyActive("8") ? "" : "disabled"}`} onClick={() => handleNumber("8")}>8</button>
        <button className={`fluent-btn num-key ${isKeyActive("9") ? "" : "disabled"}`} onClick={() => handleNumber("9")}>9</button>
        <button className="fluent-btn op-key" onClick={handleNegate}>+/-</button>
        <button className="fluent-btn op-key" onClick={() => handleOperator("×")}>×</button>

        {/* Row 4 */}
        <button className={`fluent-btn op-key ${isKeyActive("D") ? "" : "disabled"}`} onClick={() => handleNumber("D")}>D</button>
        <button className={`fluent-btn num-key ${isKeyActive("4") ? "" : "disabled"}`} onClick={() => handleNumber("4")}>4</button>
        <button className={`fluent-btn num-key ${isKeyActive("5") ? "" : "disabled"}`} onClick={() => handleNumber("5")}>5</button>
        <button className={`fluent-btn num-key ${isKeyActive("6") ? "" : "disabled"}`} onClick={() => handleNumber("6")}>6</button>
        <button className="fluent-btn op-key" style={{ gridColumn: "span 2" }} onClick={() => handleOperator("-")}>-</button>

        {/* Row 5 */}
        <button className={`fluent-btn op-key ${isKeyActive("E") ? "" : "disabled"}`} onClick={() => handleNumber("E")}>E</button>
        <button className={`fluent-btn num-key ${isKeyActive("1") ? "" : "disabled"}`} onClick={() => handleNumber("1")}>1</button>
        <button className={`fluent-btn num-key ${isKeyActive("2") ? "" : "disabled"}`} onClick={() => handleNumber("2")}>2</button>
        <button className={`fluent-btn num-key ${isKeyActive("3") ? "" : "disabled"}`} onClick={() => handleNumber("3")}>3</button>
        <button className="fluent-btn op-key" style={{ gridColumn: "span 2" }} onClick={() => handleOperator("+")}>+</button>

        {/* Row 6 */}
        <button className={`fluent-btn op-key ${isKeyActive("F") ? "" : "disabled"}`} onClick={() => handleNumber("F")}>F</button>
        <button className="fluent-btn op-key" style={{ gridColumn: "span 2" }} onClick={() => handleNumber("(")}>(</button>
        <button className="fluent-btn op-key" style={{ gridColumn: "span 2" }} onClick={() => handleNumber(")")}>)</button>
        <button className="fluent-btn num-key" onClick={() => handleNumber("0")}>0</button>
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
  controlBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-main)",
    fontSize: "12px",
    fontWeight: 600,
    height: "28px",
    padding: "0 12px",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.1s ease",
    borderLeft: "2px solid var(--text-accent)",
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
