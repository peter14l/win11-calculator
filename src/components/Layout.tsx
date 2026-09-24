import type React from "react";
import { useState, useEffect } from "react";
import { 
  Menu, 
  Settings, 
  History, 
  Calculator, 
  Flame, 
  Binary, 
  Calendar, 
  DollarSign, 
  Box, 
  Ruler, 
  Scale, 
  Thermometer, 
  Zap, 
  Grid, 
  Gauge, 
  Clock, 
  Cpu, 
  Activity, 
  Circle, 
  Layers
} from "lucide-react";
import type { ThemePref } from "../types";

export type CalculatorMode =
  | "standard"
  | "scientific"
  | "programmer"
  | "date"
  | "currency"
  | "volume"
  | "length"
  | "weight"
  | "temperature"
  | "energy"
  | "area"
  | "speed"
  | "time"
  | "power"
  | "data"
  | "pressure"
  | "angle"
  | "settings";

interface LayoutProps {
  currentMode: CalculatorMode;
  setMode: (mode: CalculatorMode) => void;
  theme: ThemePref;
  setTheme?: (theme: ThemePref) => void;
  children: React.ReactNode;
  showHistoryToggle?: boolean;
  onToggleHistory?: () => void;
  isHistoryOpen?: boolean;
}

interface NavItem {
  id: CalculatorMode;
  name: string;
  icon: React.ReactNode;
  category: "calculator" | "converter" | "other";
}

export const Layout: React.FC<LayoutProps> = ({
  currentMode,
  setMode,
  theme,
  children,
  showHistoryToggle = false,
  onToggleHistory,
  isHistoryOpen = false,
}) => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">(() =>
    window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? "light" : "dark");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const effectiveTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", effectiveTheme);
  }, [effectiveTheme]);

  useEffect(() => {
    if (!isNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isNavOpen]);

  const navItems: NavItem[] = [
    { id: "standard", name: "Standard", icon: <Calculator size={16} />, category: "calculator" },
    { id: "scientific", name: "Scientific", icon: <Flame size={16} />, category: "calculator" },
    { id: "programmer", name: "Programmer", icon: <Binary size={16} />, category: "calculator" },
    { id: "date", name: "Date Calculation", icon: <Calendar size={16} />, category: "calculator" },
    
    { id: "currency", name: "Currency", icon: <DollarSign size={16} />, category: "converter" },
    { id: "volume", name: "Volume", icon: <Box size={16} />, category: "converter" },
    { id: "length", name: "Length", icon: <Ruler size={16} />, category: "converter" },
    { id: "weight", name: "Weight and Mass", icon: <Scale size={16} />, category: "converter" },
    { id: "temperature", name: "Temperature", icon: <Thermometer size={16} />, category: "converter" },
    { id: "energy", name: "Energy", icon: <Zap size={16} />, category: "converter" },
    { id: "area", name: "Area", icon: <Grid size={16} />, category: "converter" },
    { id: "speed", name: "Speed", icon: <Gauge size={16} />, category: "converter" },
    { id: "time", name: "Time", icon: <Clock size={16} />, category: "converter" },
    { id: "power", name: "Power", icon: <Activity size={16} />, category: "converter" },
    { id: "data", name: "Data", icon: <Cpu size={16} />, category: "converter" },
    { id: "pressure", name: "Pressure", icon: <Layers size={16} />, category: "converter" },
    { id: "angle", name: "Angle", icon: <Circle size={16} />, category: "converter" },
  ];

  const getModeTitle = () => {
    if (currentMode === "settings") return "Settings";
    const item = navItems.find((i) => i.id === currentMode);
    return item ? item.name : "Calculator";
  };

  const handleItemClick = (mode: CalculatorMode) => {
    setMode(mode);
    setIsNavOpen(false);
  };

  return (
    <div style={styles.container}>
      {/* Titlebar/Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <button 
            className="icon-btn" 
            onClick={() => setIsNavOpen(!isNavOpen)}
            aria-label="Navigation menu"
          >
            <Menu size={20} />
          </button>
          <h1 style={styles.title}>{getModeTitle()}</h1>
        </div>
        
        {showHistoryToggle && (
          <button 
            className="icon-btn"
            style={{
              backgroundColor: isHistoryOpen ? "var(--bg-btn-active)" : undefined
            }} 
            onClick={onToggleHistory}
            aria-label="History panel"
          >
            <History size={18} />
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <div style={styles.contentArea}>
        {/* Navigation Sidebar Drawer */}
        {isNavOpen && (
          <div style={styles.backdrop} onClick={() => setIsNavOpen(false)} />
        )}
        <aside style={{
          ...styles.sidebar,
          transform: isNavOpen ? "translateX(0)" : "translateX(-100%)",
        }}>
          <div style={styles.sidebarContent}>
            <div style={styles.sidebarGroupTitle}>Calculator</div>
            {navItems
              .filter((i) => i.category === "calculator")
              .map((item) => (
                <button
                  key={item.id}
                  className="sidebar-item"
                  style={{
                    backgroundColor: currentMode === item.id ? "var(--bg-btn-hover)" : undefined,
                    borderLeft: currentMode === item.id ? "3px solid var(--text-accent)" : "3px solid transparent",
                  }}
                  onClick={() => handleItemClick(item.id)}
                >
                  <span style={styles.sidebarIcon}>{item.icon}</span>
                  <span>{item.name}</span>
                </button>
              ))}

            <div style={styles.sidebarSeparator} />
            <div style={styles.sidebarGroupTitle}>Converter</div>
            {navItems
              .filter((i) => i.category === "converter")
              .map((item) => (
                <button
                  key={item.id}
                  className="sidebar-item"
                  style={{
                    backgroundColor: currentMode === item.id ? "var(--bg-btn-hover)" : undefined,
                    borderLeft: currentMode === item.id ? "3px solid var(--text-accent)" : "3px solid transparent",
                  }}
                  onClick={() => handleItemClick(item.id)}
                >
                  <span style={styles.sidebarIcon}>{item.icon}</span>
                  <span>{item.name}</span>
                </button>
              ))}
          </div>

          <div style={styles.sidebarFooter}>
            <button
              className="sidebar-item"
              style={{
                backgroundColor: currentMode === "settings" ? "var(--bg-btn-hover)" : undefined,
                borderLeft: currentMode === "settings" ? "3px solid var(--text-accent)" : "3px solid transparent",
              }}
              onClick={() => handleItemClick("settings")}
            >
              <span style={styles.sidebarIcon}><Settings size={16} /></span>
              <span>Settings</span>
            </button>
          </div>
        </aside>

        {/* Content child page */}
        <main style={styles.mainContent}>
          {children}
        </main>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: "100%",
    position: "relative",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    height: "50px",
    padding: "0 12px",
    zIndex: 10,
    backgroundColor: "transparent",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  iconButton: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "36px",
    height: "36px",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "transparent",
    color: "var(--text-main)",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
    outline: "none",
  },
  title: {
    fontSize: "18px",
    fontWeight: 600,
    color: "var(--text-main)",
  },
  contentArea: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 99,
    animation: "fadeIn 0.2s ease",
  },
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: "260px",
    backgroundColor: "var(--bg-sidebar)",
    borderRight: "1px solid var(--border-app)",
    zIndex: 100,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    transition: "transform 0.2s cubic-bezier(0.1, 0.9, 0.2, 1)",
    boxShadow: "var(--card-shadow)",
    backdropFilter: "var(--mica-blur)",
  },
  sidebarContent: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 0",
  },
  sidebarGroupTitle: {
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--text-sec)",
    padding: "8px 16px 4px 16px",
  },
  sidebarItem: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    padding: "10px 16px",
    border: "none",
    backgroundColor: "transparent",
    color: "var(--text-main)",
    textAlign: "left",
    cursor: "pointer",
    fontSize: "14px",
    transition: "background-color 0.1s ease",
    gap: "12px",
  },
  sidebarIcon: {
    display: "flex",
    alignItems: "center",
    color: "var(--text-main)",
  },
  sidebarSeparator: {
    height: "1px",
    backgroundColor: "var(--border-subtle)",
    margin: "12px 16px",
  },
  sidebarFooter: {
    borderTop: "1px solid var(--border-subtle)",
    padding: "8px 0",
  },
  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    height: "100%",
    width: "100%",
  },
};
