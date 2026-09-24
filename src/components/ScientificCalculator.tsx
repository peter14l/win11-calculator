import React, { useState } from "react";
import { useCalculatorEngine } from "../hooks/useCalculatorEngine";
import { useCalculatorKeyboard } from "../hooks/useCalculatorKeyboard";
import { useHoldRepeat } from "../hooks/useHoldRepeat";
import type { AngleMode, HistoryItem, HistoryTab, MemoryApi } from "../types";
import { uid } from "../types";
import { HistorySidebar } from "./HistorySidebar";

type FuncKey =
  | "sin" | "cos" | "tan" | "asin" | "acos" | "atan"
  | "sinh" | "cosh" | "tanh" | "asinh" | "acosh" | "atanh"
  | "ln" | "log" | "exp" | "pow10"
  | "rcp" | "sqr" | "cube" | "sqrt" | "abs" | "fact";

const ENGINE_FUNC: Record<FuncKey, Parameters<ReturnType<typeof useCalculatorEngine>["func"]>[0]> = {
  sin: "sin", cos: "cos", tan: "tan", asin: "asin", acos: "acos", atan: "atan",
  sinh: "sinh", cosh: "cosh", tanh: "tanh", asinh: "asinh", acosh: "acosh", atanh: "atanh",
  ln: "ln", log: "log", exp: "exp", pow10: "pow10",
  rcp: "rcp", sqr: "sqr", cube: "cube", sqrt: "sqrt", abs: "abs", fact: "fact",
};

interface ScientificCalculatorProps {
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  historyTab: HistoryTab;
  setHistoryTab: (tab: HistoryTab) => void;
  history: HistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  memory: number[];
  memoryApi: MemoryApi;
  grouping: boolean;
  angle: AngleMode;
  onAngleChange: (angle: AngleMode) => void;
}

export const ScientificCalculator: React.FC<ScientificCalculatorProps> = ({
  isHistoryOpen,
  setIsHistoryOpen,
  historyTab,
  setHistoryTab,
  history,
  setHistory,
  memory,
  memoryApi,
  grouping,
  angle,
  onAngleChange,
}) => {
  const [isSecondActive, setIsSecondActive] = useState(false);

  const engine = useCalculatorEngine({
    angle,
    grouping,
    flat: false,
    onResult: (expression, result) =>
      setHistory((prev) =>
        [{ id: uid(), expression: `${expression} =`, result }, ...prev].slice(0, 100),
      ),
  });

  const {
    displayText,
    exprText,
    rawNumber,
    inputDigit,
    inputDecimal,
    inputExp,
    operator,
    equals,
    negate,
    backspace,
    clear,
    clearEntry,
    parenOpen,
    parenClose,
    func,
    constant,
    recallAns,
    loadValue,
  } = engine;

  useCalculatorKeyboard(true, {
    digit: inputDigit,
    decimal: inputDecimal,
    op: operator,
    equals,
    backspace,
    clear,
    clearEntry,
    percent: () => undefined,
    parenOpen,
    parenClose,
    exp: inputExp,
    negate,
  });

  const hold = useHoldRepeat(backspace);

  const call = (name: FuncKey) => func(ENGINE_FUNC[name]);

  const fontSize = displayText.length > 18 ? 22 : displayText.length > 12 ? 30 : 46;

  const activeValue = parseFloat(rawNumber);
  const activeNum = Number.isNaN(activeValue) ? 0 : activeValue;

  const copyDisplay = () => {
    const text = rawNumber;
    if (text && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text);
    }
  };

  return (
    <div style={styles.outerContainer}>
      <div style={styles.calculatorPanel}>
        <div style={styles.expressionContainer}>{exprText}</div>

        <div
          style={{ ...styles.displayContainer, fontSize }}
          onClick={copyDisplay}
          title="Click to copy"
        >
          {displayText}
        </div>

<div style={styles.configBar}>
          <div style={styles.segmented}>
            {(["DEG", "RAD", "GRAD"] as const).map((m) => (
              <button
                type="button"
                key={m}
                className="chip-btn"
                style={{ backgroundColor: angle === m ? "var(--bg-btn-hover)" : undefined }}
                onClick={() => onAngleChange(m)}
              >
                {m}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="chip-btn"
            style={{ backgroundColor: isSecondActive ? "var(--bg-btn-hover)" : undefined }}
            onClick={() => setIsSecondActive(!isSecondActive)}
          >
            2nd
          </button>
          <button type="button" className="chip-btn" onClick={() => constant("pi")}>
            π
          </button>
          <button type="button" className="chip-btn" onClick={() => constant("e")}>
            e
          </button>
        </div>

        <div style={styles.memoryBar}>
          <button
            type="button"
            className="chip-btn"
            style={{ flex: 1, opacity: memory.length > 0 ? 1 : 0.4 }}
            onClick={() => memoryApi.clear()}
          >
            MC
          </button>
          <button
            type="button"
            className="chip-btn"
            style={{ flex: 1, opacity: memory.length > 0 ? 1 : 0.4 }}
            onClick={() => {
              if (memory.length > 0) loadValue(memory[0]);
            }}
          >
            MR
          </button>
          <button type="button" className="chip-btn" style={{ flex: 1 }} onClick={() => memoryApi.add(activeNum)}>
            M+
          </button>
          <button type="button" className="chip-btn" style={{ flex: 1 }} onClick={() => memoryApi.subtract(activeNum)}>
            M-
          </button>
          <button type="button" className="chip-btn" style={{ flex: 1 }} onClick={() => memoryApi.store(activeNum)}>
            MS
          </button>
          <button
            type="button"
            className="chip-btn"
            style={{ flex: 1 }}
            onClick={() => {
              setIsHistoryOpen(true);
              setHistoryTab("memory");
            }}
          >
            Mv
          </button>
        </div>

        <div style={styles.keypad}>
          {/* Row 1 */}
          <button type="button" className="fluent-btn op-key" onClick={() => call(isSecondActive ? "asin" : "sin")}>
            {isSecondActive ? "sin⁻¹" : "sin"}
          </button>
          <button type="button" className="fluent-btn op-key" onClick={() => call(isSecondActive ? "acos" : "cos")}>
            {isSecondActive ? "cos⁻¹" : "cos"}
          </button>
          <button type="button" className="fluent-btn op-key" onClick={() => call(isSecondActive ? "atan" : "tan")}>
            {isSecondActive ? "tan⁻¹" : "tan"}
          </button>
          <button type="button" className="fluent-btn op-key" onClick={() => call("sqr")}>
            x²
          </button>
          <button type="button" className="fluent-btn op-key" onClick={clear}>
            C
          </button>

          {/* Row 2 */}
          <button type="button" className="fluent-btn op-key" onClick={() => call(isSecondActive ? "asinh" : "sinh")}>
            {isSecondActive ? "sinh⁻¹" : "sinh"}
          </button>
          <button type="button" className="fluent-btn op-key" onClick={() => call(isSecondActive ? "acosh" : "cosh")}>
            {isSecondActive ? "cosh⁻¹" : "cosh"}
          </button>
          <button type="button" className="fluent-btn op-key" onClick={() => call(isSecondActive ? "atanh" : "tanh")}>
            {isSecondActive ? "tanh⁻¹" : "tanh"}
          </button>
          <button type="button" className="fluent-btn op-key" onClick={() => call("cube")}>
            x³
          </button>
          <button type="button" className="fluent-btn op-key" {...hold}>
            ⌫
          </button>

          {/* Row 3 */}
          <button type="button" className="fluent-btn op-key" onClick={() => call(isSecondActive ? "exp" : "ln")}>
            {isSecondActive ? "eˣ" : "ln"}
          </button>
          <button type="button" className="fluent-btn op-key" onClick={() => call(isSecondActive ? "pow10" : "log")}>
            {isSecondActive ? "10ˣ" : "log"}
          </button>
          <button type="button" className="fluent-btn op-key" onClick={() => call("rcp")}>
            ¹/x
          </button>
          <button type="button" className="fluent-btn op-key" onClick={() => operator("^")}>
            xʸ
          </button>
          <button type="button" className="fluent-btn op-key" onClick={() => operator("mod")}>
            mod
          </button>

          {/* Row 4 */}
          <button type="button" className="fluent-btn op-key" onClick={() => call("sqrt")}>
            √
          </button>
          <button type="button" className="fluent-btn op-key" onClick={() => operator("root")}>
            ʸ√x
          </button>
          <button type="button" className="fluent-btn op-key" onClick={() => call("abs")}>
            |x|
          </button>
          <button type="button" className="fluent-btn op-key" onClick={() => call("fact")}>
            n!
          </button>
          <button type="button" className="fluent-btn op-key" onClick={() => operator("÷")}>
            ÷
          </button>

          {/* Row 5 */}
          <button type="button" className="fluent-btn op-key" onClick={negate}>
            +/-
          </button>
          <button type="button" className="fluent-btn num-key" onClick={() => inputDigit("7")}>
            7
          </button>
          <button type="button" className="fluent-btn num-key" onClick={() => inputDigit("8")}>
            8
          </button>
          <button type="button" className="fluent-btn num-key" onClick={() => inputDigit("9")}>
            9
          </button>
          <button type="button" className="fluent-btn op-key" onClick={() => operator("×")}>
            ×
          </button>

          {/* Row 6 */}
          <button type="button" className="fluent-btn op-key" onClick={parenOpen}>
            (
          </button>
          <button type="button" className="fluent-btn num-key" onClick={() => inputDigit("4")}>
            4
          </button>
          <button type="button" className="fluent-btn num-key" onClick={() => inputDigit("5")}>
            5
          </button>
          <button type="button" className="fluent-btn num-key" onClick={() => inputDigit("6")}>
            6
          </button>
          <button type="button" className="fluent-btn op-key" onClick={() => operator("-")}>
            -
          </button>

          {/* Row 7 */}
          <button type="button" className="fluent-btn op-key" onClick={parenClose}>
            )
          </button>
          <button type="button" className="fluent-btn num-key" onClick={() => inputDigit("1")}>
            1
          </button>
          <button type="button" className="fluent-btn num-key" onClick={() => inputDigit("2")}>
            2
          </button>
          <button type="button" className="fluent-btn num-key" onClick={() => inputDigit("3")}>
            3
          </button>
          <button type="button" className="fluent-btn op-key" onClick={() => operator("+")}>
            +
          </button>

          {/* Row 8 */}
          <button type="button" className="fluent-btn num-key" onClick={() => inputDigit("0")}>
            0
          </button>
          <button type="button" className="fluent-btn op-key" onClick={recallAns}>
            Ans
          </button>
          <button type="button" className="fluent-btn num-key" onClick={inputDecimal}>
            .
          </button>
          <button type="button" className="fluent-btn accent-key" style={{ gridColumn: "span 2" }} onClick={equals}>
            =
          </button>
        </div>
      </div>

      <HistorySidebar
        open={isHistoryOpen}
        tab={historyTab}
        setTab={setHistoryTab}
        history={history}
        onSelectHistory={(result) => loadValue(parseFloat(result))}
        onClearHistory={() => setHistory([])}
        memory={memory}
        memoryApi={memoryApi}
        onSelectMemory={(v) => loadValue(v)}
        onClearMemory={() => memoryApi.clear()}
        activeValue={activeNum}
        grouping={grouping}
      />
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
    minWidth: 0,
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
    fontWeight: "600",
    color: "var(--text-main)",
    textAlign: "right",
    padding: "0 8px 8px 8px",
    wordBreak: "break-all",
    flex: 0.3,
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    cursor: "pointer",
  },
  configBar: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "4px",
  },
  segmented: {
    display: "flex",
    gap: "4px",
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
