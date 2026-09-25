import React from "react";
import { useCalculatorEngine } from "../hooks/useCalculatorEngine";
import { useCalculatorKeyboard } from "../hooks/useCalculatorKeyboard";
import { useHoldRepeat } from "../hooks/useHoldRepeat";
import { isNumberMem, type HistoryItem, type HistoryTab, type MemoryApi, type MemoryValue } from "../types";
import { HistorySidebar } from "./HistorySidebar";

interface StandardCalculatorProps {
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  historyTab: HistoryTab;
  setHistoryTab: (tab: HistoryTab) => void;
  history: HistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  pushHistory: (expression: string, result: string) => void;
  memory: MemoryValue[];
  memoryApi: MemoryApi;
  grouping: boolean;
}

export const StandardCalculator: React.FC<StandardCalculatorProps> = ({
  isHistoryOpen,
  setIsHistoryOpen,
  historyTab,
  setHistoryTab,
  history,
  setHistory,
  pushHistory,
  memory,
  memoryApi,
  grouping,
}) => {
  const engine = useCalculatorEngine({
    angle: "DEG",
    grouping,
    flat: true,
    fractions: true,
    complex: false,
    onResult: pushHistory,
  });

  const {
    displayText,
    exprText,
    activeNumber,
    inputDigit,
    inputDecimal,
    aOverB,
    operator,
    equals,
    percent,
    negate,
    backspace,
    clear,
    clearEntry,
    func,
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
    percent,
    negate,
  });

  const hold = useHoldRepeat(backspace);

  const fontSize = displayText.length > 18 ? 22 : displayText.length > 12 ? 30 : 46;

  const activeNum = Number.isNaN(activeNumber) ? 0 : activeNumber;

  const copyDisplay = () => {
    const text = displayText;
    if (text && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text);
    }
  };

  const selectHistory = (result: string) => {
    const v = parseFloat(result);
    if (!Number.isNaN(v)) loadValue(v);
  };

  const selectMemory = (v: MemoryValue) => {
    if (isNumberMem(v)) loadValue(v);
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
              if (memory.length > 0 && isNumberMem(memory[0])) loadValue(memory[0]);
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
          <button type="button" className="fluent-btn op-key" onClick={percent}>
            %
          </button>
          <button type="button" className="fluent-btn op-key" onClick={clearEntry}>
            CE
          </button>
          <button type="button" className="fluent-btn op-key" onClick={clear}>
            C
          </button>
          <button type="button" className="fluent-btn op-key" {...hold}>
            ⌫
          </button>

          <button type="button" className="fluent-btn op-key" onClick={() => func("rcp")}>
            ¹/x
          </button>
          <button type="button" className="fluent-btn op-key" onClick={() => func("sqr")}>
            x²
          </button>
          <button type="button" className="fluent-btn op-key" onClick={() => func("sqrt")}>
            ²√x
          </button>
          <button type="button" className="fluent-btn op-key" onClick={() => operator("÷")}>
            ÷
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

          <button type="button" className="fluent-btn op-key" onClick={aOverB}>
            a/b
          </button>
          <button type="button" className="fluent-btn num-key" onClick={negate}>
            +/-
          </button>
          <button type="button" className="fluent-btn num-key" onClick={() => inputDigit("0")}>
            0
          </button>
          <button type="button" className="fluent-btn num-key" onClick={inputDecimal}>
            .
          </button>

          <button type="button" className="fluent-btn accent-key" style={{ gridColumn: "span 4" }} onClick={equals}>
            =
          </button>
        </div>
      </div>

      <HistorySidebar
        open={isHistoryOpen}
        tab={historyTab}
        setTab={setHistoryTab}
        history={history}
        onSelectHistory={selectHistory}
        onClearHistory={() => setHistory([])}
        memory={memory}
        memoryApi={memoryApi}
        onSelectMemory={selectMemory}
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
  memoryBar: {
    display: "flex",
    gap: "4px",
    marginBottom: "8px",
  },
  keypad: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gridTemplateRows: "repeat(7, 1fr)",
    gap: "2px",
  },
};