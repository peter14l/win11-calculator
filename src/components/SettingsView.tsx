import React from "react";
import { Sun, Moon, Info, Globe } from "lucide-react";

interface SettingsViewProps {
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ theme, setTheme }) => {
  return (
    <div style={styles.container}>
      <h2 style={styles.sectionTitle}>App Theme</h2>
      <div style={styles.card}>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>Choose theme mode</span>
          <div style={styles.themeToggleGroup}>
            <button 
              style={{
                ...styles.themeBtn,
                backgroundColor: theme === "light" ? "var(--bg-btn-accent)" : "transparent",
                color: theme === "light" ? "#fff" : "var(--text-main)"
              }}
              onClick={() => setTheme("light")}
            >
              <Sun size={16} />
              Light
            </button>
            <button 
              style={{
                ...styles.themeBtn,
                backgroundColor: theme === "dark" ? "var(--bg-btn-accent)" : "transparent",
                color: theme === "dark" ? "#fff" : "var(--text-main)"
              }}
              onClick={() => setTheme("dark")}
            >
              <Moon size={16} />
              Dark
            </button>
          </div>
        </div>
      </div>

      <h2 style={styles.sectionTitle}>About</h2>
      <div style={styles.card}>
        <div style={styles.infoRow}>
          <Info size={20} style={{ color: "var(--text-accent)" }} />
          <div style={styles.infoText}>
            <div style={{ fontWeight: 600 }}>Windows 11 Calculator Clone</div>
            <div style={{ fontSize: "12px", color: "var(--text-sec)" }}>Version 2.0.1 (Stable)</div>
            <div style={{ fontSize: "13px", marginTop: "8px" }}>
              A high-fidelity clone of the Windows 11 Calculator. Supports Standard, Scientific, Programmer, Date, and all Converter modes.
            </div>
          </div>
        </div>
        
        <div style={styles.separator} />
        
        <div style={styles.infoRow}>
          <Globe size={20} style={{ color: "var(--text-main)" }} />
          <div style={styles.infoText}>
            <div style={{ fontWeight: 600 }}>Developer Information</div>
            <div style={{ fontSize: "13px", color: "var(--text-sec)" }}>
              Created with React + TypeScript + Capacitor for Android deployment.
            </div>
          </div>
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
    overflowY: "auto",
    maxWidth: "500px",
  },
  sectionTitle: {
    fontSize: "15px",
    fontWeight: 600,
    color: "var(--text-main)",
    margin: "16px 0 8px 0",
  },
  card: {
    backgroundColor: "var(--bg-btn-op)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "6px",
    padding: "16px",
    marginBottom: "16px",
  },
  settingRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
  },
  settingLabel: {
    fontSize: "14px",
    color: "var(--text-main)",
  },
  themeToggleGroup: {
    display: "flex",
    backgroundColor: "var(--bg-sidebar)",
    borderRadius: "6px",
    padding: "2px",
    border: "1px solid var(--border-subtle)",
  },
  themeBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    border: "none",
    padding: "6px 16px",
    borderRadius: "4px",
    fontSize: "13px",
    cursor: "pointer",
    transition: "background-color 0.15s, color 0.15s",
  },
  infoRow: {
    display: "flex",
    gap: "16px",
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
  },
  separator: {
    height: "1px",
    backgroundColor: "var(--border-subtle)",
    margin: "16px 0",
  },
};
