import type React from "react";
import { useState } from "react";
import { ArrowDownUp } from "lucide-react";
import { CONVERTER_CATEGORIES, convertValue } from "../utils/converterData";

interface UnitConverterProps {
  categoryId: string;
  grouping: boolean;
}

const strip = (s: string): string => s.replace(/,/g, "");

const groupThousands = (s: string): string => {
  const m = /^(-?)(\d+)((?:\.\d+)?)$/.exec(s);
  if (!m) return s;
  return m[1] + m[2].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + m[3];
};

export const UnitConverter: React.FC<UnitConverterProps> = ({ categoryId, grouping }) => {
  const category = CONVERTER_CATEGORIES.find((c) => c.id === categoryId);

  const [fromUnit, setFromUnit] = useState(() => category?.units[0]?.id ?? "");
  const [toUnit, setToUnit] = useState(() => category?.units[1]?.id ?? category?.units[0]?.id ?? "");
  const [activeSide, setActiveSide] = useState<"from" | "to">("from");
  const [activeRaw, setActiveRaw] = useState("1");

  if (!category) {
    return <div style={{ padding: 20 }}>Converter category not found.</div>;
  }

  const formatDisplay = (num: number): string => {
    if (!isFinite(num)) return "0";
    if (num === 0) return "0";
    let txt: string;
    if (Math.abs(num) >= 1e12 || Math.abs(num) < 1e-6) {
      txt = num.toExponential(4).replace(/(\.\d*?)0+e/, "$1e").replace(/\.e/, "e");
    } else {
      txt = parseFloat(num.toFixed(8)).toString();
    }
    return grouping ? groupThousands(txt) : txt;
  };

  const activeNum = parseFloat(activeRaw) || 0;
  const fromVal = activeSide === "from"
    ? activeRaw
    : formatDisplay(convertValue(activeNum, toUnit, fromUnit, categoryId));
  const toVal = activeSide === "to"
    ? activeRaw
    : formatDisplay(convertValue(activeNum, fromUnit, toUnit, categoryId));

  const activateSide = (side: "from" | "to") => {
    if (activeSide === side) return;
    const derived = side === "from" ? fromVal : toVal;
    setActiveSide(side);
    setActiveRaw(strip(derived));
  };

  const handleSwap = () => {
    const other = activeSide === "from" ? toVal : fromVal;
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setActiveRaw(strip(other));
  };

  const handleKeypadPress = (key: string) => {
    if (key === "CE" || key === "C") {
      setActiveRaw("0");
    } else if (key === "⌫") {
      setActiveRaw((v) => (v.length > 1 ? v.slice(0, -1) : "0"));
    } else if (key === ".") {
      setActiveRaw((v) => (v.includes(".") ? v : v + "."));
    } else if (key === "+/-") {
      setActiveRaw((v) => String((parseFloat(v) || 0) * -1));
    } else {
      setActiveRaw((v) =>
        v === "0"
          ? key
          : v.replace(/[^0-9]/g, "").length < 12
            ? v + key
            : v
      );
    }
  };

  const comparison = category.getComparison
    ? category.getComparison(activeNum, activeSide === "from" ? fromUnit : toUnit) || ""
    : "";

  return (
    <div style={styles.container}>
      <div style={styles.displaySection}>
        <div
          style={{
            ...styles.unitBox,
            borderLeft: activeSide === "from" ? "4px solid var(--text-accent)" : "4px solid transparent",
          }}
          onClick={() => activateSide("from")}
        >
          <input
            style={styles.valInput}
            inputMode="decimal"
            value={fromVal}
            readOnly={activeSide !== "from"}
            onFocus={() => activateSide("from")}
            onChange={(e) => {
              setActiveSide("from");
              setActiveRaw(e.target.value);
            }}
          />
          <select
            style={styles.dropdown}
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value)}
          >
            {category.units.map((unit) => (
              <option key={unit.id} value={unit.id} style={styles.option}>
                {unit.name} {unit.symbol ? `(${unit.symbol})` : ""}
              </option>
            ))}
          </select>
        </div>

        <button className="icon-btn" style={styles.swapBtn} onClick={handleSwap} aria-label="Swap units">
          <ArrowDownUp size={16} />
        </button>

        <div
          style={{
            ...styles.unitBox,
            borderLeft: activeSide === "to" ? "4px solid var(--text-accent)" : "4px solid transparent",
          }}
          onClick={() => activateSide("to")}
        >
          <input
            style={styles.valInput}
            inputMode="decimal"
            value={toVal}
            readOnly={activeSide !== "to"}
            onFocus={() => activateSide("to")}
            onChange={(e) => {
              setActiveSide("to");
              setActiveRaw(e.target.value);
            }}
          />
          <select
            style={styles.dropdown}
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value)}
          >
            {category.units.map((unit) => (
              <option key={unit.id} value={unit.id} style={styles.option}>
                {unit.name} {unit.symbol ? `(${unit.symbol})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.comparisonArea}>
        {comparison && <div style={styles.comparisonCard}>{comparison}</div>}
        {categoryId === "currency" && (
          <div style={styles.rateNote}>Rates are fixed reference values — not live market data.</div>
        )}
      </div>

      <div style={styles.keypadContainer}>
        <div style={styles.keypad}>
          <button className="fluent-btn op-key" onClick={() => handleKeypadPress("7")}>7</button>
          <button className="fluent-btn op-key" onClick={() => handleKeypadPress("8")}>8</button>
          <button className="fluent-btn op-key" onClick={() => handleKeypadPress("9")}>9</button>
          <button className="fluent-btn op-key" onClick={() => handleKeypadPress("⌫")}>⌫</button>

          <button className="fluent-btn op-key" onClick={() => handleKeypadPress("4")}>4</button>
          <button className="fluent-btn op-key" onClick={() => handleKeypadPress("5")}>5</button>
          <button className="fluent-btn op-key" onClick={() => handleKeypadPress("6")}>6</button>
          <button className="fluent-btn op-key" onClick={() => handleKeypadPress("CE")}>CE</button>

          <button className="fluent-btn op-key" onClick={() => handleKeypadPress("1")}>1</button>
          <button className="fluent-btn op-key" onClick={() => handleKeypadPress("2")}>2</button>
          <button className="fluent-btn op-key" onClick={() => handleKeypadPress("3")}>3</button>
          <button className="fluent-btn op-key" onClick={() => handleKeypadPress("C")}>C</button>

          <button className="fluent-btn op-key" onClick={() => handleKeypadPress("+/-")}>+/-</button>
          <button className="fluent-btn op-key" onClick={() => handleKeypadPress("0")}>0</button>
          <button className="fluent-btn op-key" onClick={() => handleKeypadPress(".")}>.</button>
          <button className="fluent-btn accent-key" onClick={handleSwap}>⇅</button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    padding: "0 24px 24px 24px",
    flex: 1,
    height: "100%",
    overflow: "hidden",
  },
  displaySection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "16px",
  },
  unitBox: {
    padding: "12px",
    backgroundColor: "var(--bg-btn-op)",
    borderRadius: "6px",
    border: "1px solid var(--border-subtle)",
  },
  valInput: {
    fontSize: "26px",
    fontWeight: "bold",
    marginBottom: "4px",
    width: "100%",
    background: "transparent",
    border: "none",
    color: "var(--text-main)",
    outline: "none",
    wordBreak: "break-all",
    fontFamily: "inherit",
  },
  swapBtn: {
    alignSelf: "flex-start",
    marginLeft: "8px",
  },
  dropdown: {
    width: "100%",
    background: "transparent",
    color: "var(--text-main)",
    border: "none",
    fontSize: "14px",
    cursor: "pointer",
    outline: "none",
  },
  option: {
    backgroundColor: "var(--bg-sidebar)",
    color: "var(--text-main)",
  },
  comparisonArea: {
    flex: 1,
    minHeight: "40px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    justifyContent: "center",
  },
  comparisonCard: {
    width: "100%",
    padding: "10px 14px",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderLeft: "3px solid var(--text-accent)",
    fontSize: "13px",
    color: "var(--text-sec)",
    borderRadius: "0 4px 4px 0",
  },
  rateNote: {
    fontSize: "12px",
    color: "var(--text-sec)",
  },
  keypadContainer: {
    flex: 1.5,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  keypad: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gridTemplateRows: "repeat(4, 1fr)",
    gap: "3px",
    height: "220px",
  },
};