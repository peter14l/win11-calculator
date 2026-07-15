import { useState } from "react";
import { Layout } from "./components/Layout";
import type { CalculatorMode } from "./components/Layout";
import { StandardCalculator } from "./components/StandardCalculator";
import type { HistoryItem } from "./components/StandardCalculator";
import { ScientificCalculator } from "./components/ScientificCalculator";
import { ProgrammerCalculator } from "./components/ProgrammerCalculator";
import { DateCalculator } from "./components/DateCalculator";
import { UnitConverter } from "./components/UnitConverter";
import { SettingsView } from "./components/SettingsView";

function App() {
  const [mode, setMode] = useState<CalculatorMode>("standard");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const handleToggleHistory = () => {
    setIsHistoryOpen(!isHistoryOpen);
  };

  const renderContent = () => {
    switch (mode) {
      case "standard":
        return (
          <StandardCalculator
            isHistoryOpen={isHistoryOpen}
            setIsHistoryOpen={setIsHistoryOpen}
            history={history}
            setHistory={setHistory}
          />
        );
      case "scientific":
        return (
          <ScientificCalculator
            isHistoryOpen={isHistoryOpen}
            setIsHistoryOpen={setIsHistoryOpen}
          />
        );
      case "programmer":
        return <ProgrammerCalculator />;
      case "date":
        return <DateCalculator />;
      case "settings":
        return <SettingsView theme={theme} setTheme={setTheme} />;
      default:
        // All converters use the reusable UnitConverter component
        return <UnitConverter categoryId={mode} />;
    }
  };

  const showHistoryToggle = mode === "standard" || mode === "scientific";

  return (
    <Layout
      currentMode={mode}
      setMode={setMode}
      theme={theme}
      setTheme={setTheme}
      showHistoryToggle={showHistoryToggle}
      onToggleHistory={handleToggleHistory}
      isHistoryOpen={isHistoryOpen}
    >
      {renderContent()}
    </Layout>
  );
}

export default App;
