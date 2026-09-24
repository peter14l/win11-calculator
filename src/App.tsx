import { useCallback, useMemo, useState } from "react";
import { Layout } from "./components/Layout";
import type { CalculatorMode } from "./components/Layout";
import { StandardCalculator } from "./components/StandardCalculator";
import { ScientificCalculator } from "./components/ScientificCalculator";
import { ProgrammerCalculator } from "./components/ProgrammerCalculator";
import { DateCalculator } from "./components/DateCalculator";
import { UnitConverter } from "./components/UnitConverter";
import { SettingsView } from "./components/SettingsView";
import { usePersistentState } from "./hooks/usePersistentState";
import type { AngleMode, HistoryItem, HistoryTab, MemoryApi, ThemePref } from "./types";

function App() {
  const [mode, setMode] = useState<CalculatorMode>("standard");
  const [themePref, setThemePref] = usePersistentState<ThemePref>("calc.theme", "dark");
  const [grouping, setGrouping] = usePersistentState<boolean>("calc.thousands", true);
  const [angle, setAngle] = usePersistentState<AngleMode>("calc.angle", "DEG");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyTab, setHistoryTab] = useState<HistoryTab>("history");
  const [history, setHistory] = usePersistentState<HistoryItem[]>("calc.history", []);
  const [memory, setMemory] = usePersistentState<number[]>("calc.memory", []);

  const memoryApi = useMemo<MemoryApi>(
    () => ({
      store: (v) => setMemory((m) => [v, ...m].slice(0, 100)),
      clear: () => setMemory([]),
      add: (v) => setMemory((m) => (m.length ? [m[0] + v, ...m.slice(1)] : [v])),
      subtract: (v) => setMemory((m) => (m.length ? [m[0] - v, ...m.slice(1)] : [-v])),
      removeAt: (i) => setMemory((m) => m.filter((_, j) => j !== i)),
      addAt: (i, v) => setMemory((m) => m.map((x, j) => (j === i ? x + v : x))),
      subtractAt: (i, v) => setMemory((m) => m.map((x, j) => (j === i ? x - v : x))),
    }),
    [setMemory],
  );

  const handleToggleHistory = useCallback(() => {
    setIsHistoryOpen((open) => !open);
  }, []);

  const calculatorProps = {
    isHistoryOpen,
    setIsHistoryOpen,
    historyTab,
    setHistoryTab,
    history,
    setHistory,
    memory,
    memoryApi,
    grouping,
  };

  const renderContent = () => {
    switch (mode) {
      case "standard":
        return <StandardCalculator {...calculatorProps} />;
      case "scientific":
        return (
          <ScientificCalculator {...calculatorProps} angle={angle} onAngleChange={setAngle} />
        );
      case "programmer":
        return <ProgrammerCalculator grouping={grouping} />;
      case "date":
        return <DateCalculator />;
      case "settings":
        return (
          <SettingsView
            themePref={themePref}
            setThemePref={setThemePref}
            grouping={grouping}
            setGrouping={setGrouping}
            angle={angle}
            setAngle={setAngle}
            onClearHistory={() => setHistory([])}
            onClearMemory={() => setMemory([])}
            hasHistory={history.length > 0}
            hasMemory={memory.length > 0}
          />
        );
      default:
        return <UnitConverter key={mode} categoryId={mode} grouping={grouping} />;
    }
  };

  const showHistoryToggle = mode === "standard" || mode === "scientific";

  return (
    <Layout
      currentMode={mode}
      setMode={setMode}
      theme={themePref}
      setTheme={setThemePref}
      showHistoryToggle={showHistoryToggle}
      onToggleHistory={handleToggleHistory}
      isHistoryOpen={isHistoryOpen}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;