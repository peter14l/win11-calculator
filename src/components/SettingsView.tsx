import type React from "react";
import { Sun, Moon, Monitor, Info, Globe, Trash2 } from "lucide-react";
import type { AngleMode, ThemePref } from "../types";

interface SettingsViewProps {
  themePref: ThemePref;
  setThemePref: (theme: ThemePref) => void;
  grouping: boolean;
  setGrouping: (group: boolean) => void;
  angle: AngleMode;
  setAngle: (angle: AngleMode) => void;
  onClearHistory: () => void;
  onClearMemory: () => void;
  hasHistory: boolean;
  hasMemory: boolean;
}

const SEG_ACTIVE: React.CSSProperties = {
  backgroundColor: "var(--bg-btn-accent)",
  color: "#fff",
};

export const SettingsView: React.FC<SettingsViewProps> = ({
  themePref,
  setThemePref,
  grouping,
  setGrouping,
  angle,
  setAngle,
  onClearHistory,
  onClearMemory,
  hasHistory,
  hasMemory,
}) => {
  const themes: { id: ThemePref; label: string; icon: React.ReactNode }[] = [
    { id: "light", label: "Light", icon: <Sun size={16} /> },
    { id: "dark", label: "Dark", icon: <Moon size={16} /> },
    { id: "system", label: "System", icon: <Monitor size={16} /> },
  ];
  const modes: { id: AngleMode; label: string }[] = [
    { id: "DEG", label: "DEG" },
    { id: "RAD", label: "RAD" },
    { id: "GRAD", label: "GRAD" },
  ];

  return (
    <div style={styles.container}>
      <h2 style={styles.sectionTitle}>App theme</h2>
      <div style={styles.card}>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>Theme mode</span>
          <div style={styles.toggleGroup}>
            {themes.map((t) => (
              <button
                key={t.id}
                className="seg-btn"
                style={themePref === t.id ? SEG_ACTIVE : undefined}
                onClick={() => setThemePref(t.id)}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <h2 style={styles.sectionTitle}>Formatting</h2>
      <div style={styles.card}>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>Thousands separator</span>
          <div style={styles.toggleGroup}>
            <button className="seg-btn" style={!grouping ? SEG_ACTIVE : undefined} onClick={() => setGrouping(false)}>
              Off
            </button>
            <button className="seg-btn" style={grouping ? SEG_ACTIVE : undefined} onClick={() => setGrouping(true)}>
              On
            </button>
          </div>
        </div>
        <div style={styles.separator} />
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>Default angle for Scientific</span>
          <div style={styles.toggleGroup}>
            {modes.map((m) => (
              <button
                key={m.id}
                className="seg-btn"
                style={angle === m.id ? SEG_ACTIVE : undefined}
                onClick={() => setAngle(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <h2 style={styles.sectionTitle}>Clear data</h2>
      <div style={styles.card}>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>Delete calculation history</span>
          <button className="chip-btn danger" disabled={!hasHistory} onClick={onClearHistory}>
            <Trash2 size={14} />
            Clear
          </button>
        </div>
        <div style={styles.separator} />
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>Clear stored memory values</span>
          <button className="chip-btn danger" disabled={!hasMemory} onClick={onClearMemory}>
            <Trash2 size={14} />
            Clear
          </button>
        </div>
      </div>

      <h2 style={styles.sectionTitle}>About</h2>
      <div style={styles.card}>
        <div style={styles.infoRow}>
          <Info size={20} style={{ color: "var(--text-accent)" }} />
          <div style={styles.infoText}>
            <div style={{ fontWeight: 600 }}>Windows 11 Calculator Clone</div>
            <div style={{ fontSize: "12px", color: "var(--text-sec)" }}>Version 1.0.1</div>
            <div style={{ fontSize: "13px", marginTop: "8px" }}>
              A high-fidelity clone of the Windows 11 Calculator. Supports Standard, Scientific,
              Programmer, Date, and all Converter modes.
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
  toggleGroup: {
    display: "flex",
    backgroundColor: "var(--bg-sidebar)",
    borderRadius: "6px",
    padding: "2px",
    border: "1px solid var(--border-subtle)",
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