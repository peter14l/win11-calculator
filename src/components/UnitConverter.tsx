import React, { useState, useEffect } from "react";
import { CONVERTER_CATEGORIES, convertValue } from "../utils/converterData";

interface UnitConverterProps {
  categoryId: string;
}

export const UnitConverter: React.FC<UnitConverterProps> = ({ categoryId }) => {
  const category = CONVERTER_CATEGORIES.find((c) => c.id === categoryId);

  if (!category) {
    return <div style={{ padding: 20 }}>Converter category not found.</div>;
  }

  // Active units
  const [fromUnit, setFromUnit] = useState(category.units[0].id);
  const [toUnit, setToUnit] = useState(category.units[1]?.id || category.units[0].id);

  // Buffer values
  const [fromVal, setFromVal] = useState("1");
  const [toVal, setToVal] = useState("1");
  
  // Track which input is active
  const [activeSide, setActiveSide] = useState<"from" | "to">("from");

  // Reset values when category changes
  useEffect(() => {
    const cat = CONVERTER_CATEGORIES.find((c) => c.id === categoryId);
    if (cat) {
      setFromUnit(cat.units[0].id);
      setToUnit(cat.units[1]?.id || cat.units[0].id);
      setFromVal("1");
      setActiveSide("from");
    }
  }, [categoryId]);

  // Handle calculations in real-time
  useEffect(() => {
    if (activeSide === "from") {
      const parsed = parseFloat(fromVal) || 0;
      const converted = convertValue(parsed, fromUnit, toUnit, categoryId);
      setToVal(formatDisplay(converted));
    } else {
      const parsed = parseFloat(toVal) || 0;
      const converted = convertValue(parsed, toUnit, fromUnit, categoryId);
      setFromVal(formatDisplay(converted));
    }
  }, [fromVal, toVal, fromUnit, toUnit, activeSide, categoryId]);

  const formatDisplay = (num: number): string => {
    if (isNaN(num)) return "0";
    if (num === 0) return "0";
    
    // Limits number of decimal places for display clarity
    const str = num.toFixed(8);
    const parsed = parseFloat(str);
    
    if (Math.abs(parsed) > 1e12 || (Math.abs(parsed) < 1e-6 && parsed !== 0)) {
      return parsed.toExponential(4);
    }
    return parsed.toString();
  };

  const handleKeypadPress = (key: string) => {
    const currentVal = activeSide === "from" ? fromVal : toVal;
    const setVal = activeSide === "from" ? setFromVal : setToVal;

    if (key === "CE" || key === "C") {
      setVal("0");
    } else if (key === "⌫") {
      if (currentVal.length > 1) {
        setVal(currentVal.slice(0, -1));
      } else {
        setVal("0");
      }
    } else if (key === ".") {
      if (!currentVal.includes(".")) {
        setVal(currentVal + ".");
      }
    } else if (key === "+/-") {
      const parsed = parseFloat(currentVal) || 0;
      setVal((parsed * -1).toString());
    } else {
      // Numerical keys
      if (currentVal === "0") {
        setVal(key);
      } else {
        if (currentVal.replace(/[^0-9]/g, "").length < 12) {
          setVal(currentVal + key);
        }
      }
    }
  };

  const getComparisonText = () => {
    if (!category.getComparison) return "";
    const activeVal = activeSide === "from" ? parseFloat(fromVal) : parseFloat(toVal);
    const activeUnit = activeSide === "from" ? fromUnit : toUnit;
    
    if (isNaN(activeVal) || activeVal === 0) return "";
    return category.getComparison(activeVal, activeUnit);
  };

  return (
    <div style={styles.container}>
      {/* Display values side-by-side or stacked */}
      <div style={styles.displaySection}>
        {/* From Section */}
        <div 
          style={{
            ...styles.unitBox,
            borderLeft: activeSide === "from" ? "4px solid var(--text-accent)" : "4px solid transparent"
          }}
          onClick={() => setActiveSide("from")}
        >
          <div style={styles.valText}>{fromVal}</div>
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

        {/* To Section */}
        <div 
          style={{
            ...styles.unitBox,
            borderLeft: activeSide === "to" ? "4px solid var(--text-accent)" : "4px solid transparent"
          }}
          onClick={() => setActiveSide("to")}
        >
          <div style={styles.valText}>{toVal}</div>
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

      {/* Comparisons Section */}
      <div style={styles.comparisonArea}>
        {getComparisonText() && (
          <div style={styles.comparisonCard}>
            {getComparisonText()}
          </div>
        )}
      </div>

      {/* Custom numerical keypad */}
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
          <button className="fluent-btn op-key" style={{ opacity: 0.2, pointerEvents: "none" }}></button>
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
    gap: "16px",
    marginBottom: "16px",
  },
  unitBox: {
    padding: "12px",
    backgroundColor: "var(--bg-btn-op)",
    borderRadius: "6px",
    border: "1px solid var(--border-subtle)",
    cursor: "pointer",
  },
  valText: {
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "4px",
    wordBreak: "break-all",
    color: "var(--text-main)",
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
    alignItems: "center",
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
