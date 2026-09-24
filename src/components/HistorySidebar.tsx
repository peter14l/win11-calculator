import React from "react";
import { Trash2 } from "lucide-react";
import type { HistoryItem, HistoryTab, MemoryApi } from "../types";

interface HistorySidebarProps {
  open: boolean;
  tab: HistoryTab;
  setTab: (tab: HistoryTab) => void;
  history: HistoryItem[];
  onSelectHistory: (result: string) => void;
  onClearHistory: () => void;
  memory: number[];
  memoryApi: MemoryApi;
  onSelectMemory: (v: number) => void;
  onClearMemory: () => void;
  activeValue: number;
  grouping: boolean;
}

const formatMem = (v: number, grouping: boolean): string => {
  const abs = Math.abs(v);
  if (Number.isNaN(v)) return "Error";
  if (abs > 1e15 || (abs < 1e-12 && v !== 0)) {
    return v.toExponential(8).replace(/\.?0+e/, "e");
  }
  const s = parseFloat(v.toFixed(12)).toString();
  if (grouping && s.includes(".")) {
    const [int, frac] = s.split(".");
    return int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + frac;
  }
  if (grouping && !s.includes("e")) {
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  return s;
};

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  open,
  tab,
  setTab,
  history,
  onSelectHistory,
  onClearHistory,
  memory,
  memoryApi,
  onSelectMemory,
  onClearMemory,
  activeValue,
  grouping,
}) => {
  return (
    <aside
      className="history-sidebar"
      style={{
        width: open ? 280 : 0,
        borderLeft: open ? "1px solid var(--border-app)" : "1px solid transparent",
      }}
      aria-hidden={!open}
    >
      <div style={styles.inner}>
        <div style={styles.historyTabs}>
          <button
            type="button"
            className="tab-btn"
            style={{
              borderBottom: tab === "history" ? "2px solid var(--text-accent)" : "2px solid transparent",
              fontWeight: tab === "history" ? 600 : 400,
            }}
            onClick={() => setTab("history")}
          >
            History
          </button>
          <button
            type="button"
            className="tab-btn"
            style={{
              borderBottom: tab === "memory" ? "2px solid var(--text-accent)" : "2px solid transparent",
              fontWeight: tab === "memory" ? 600 : 400,
            }}
            onClick={() => setTab("memory")}
          >
            Memory
          </button>
        </div>

        <div style={styles.historyContent}>
          {tab === "history" ? (
            history.length === 0 ? (
              <div style={styles.emptyText}>There's no history yet</div>
            ) : (
              <div style={styles.historyList}>
                {history.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className="history-item"
                    onClick={() => onSelectHistory(item.result)}
                  >
                    <div style={styles.historyExpr}>{item.expression}</div>
                    <div style={styles.historyRes}>{item.result}</div>
                  </button>
                ))}
              </div>
            )
          ) : memory.length === 0 ? (
            <div style={styles.emptyText}>There's nothing saved in memory</div>
          ) : (
            <div style={styles.historyList}>
              {memory.map((val, idx) => (
                <div key={idx} style={styles.memoryItem}>
                  <button
                    type="button"
                    style={styles.memoryValBtn}
                    onClick={() => onSelectMemory(val)}
                  >
                    {formatMem(val, grouping)}
                  </button>
                  <div style={styles.memoryRowActions}>
                    <button
                      type="button"
                      className="memory-action"
                      onClick={() => memoryApi.removeAt(idx)}
                    >
                      MC
                    </button>
                    <button
                      type="button"
                      className="memory-action"
                      onClick={() => memoryApi.addAt(idx, activeValue)}
                    >
                      M+
                    </button>
                    <button
                      type="button"
                      className="memory-action"
                      onClick={() => memoryApi.subtractAt(idx, activeValue)}
                    >
                      M-
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.historyFooter}>
          {tab === "history" && history.length > 0 && (
            <button
              type="button"
              className="icon-btn"
              onClick={onClearHistory}
              aria-label="Clear history"
            >
              <Trash2 size={16} />
            </button>
          )}
          {tab === "memory" && memory.length > 0 && (
            <button
              type="button"
              className="icon-btn"
              onClick={onClearMemory}
              aria-label="Clear memory"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  inner: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    width: 280,
    backgroundColor: "var(--bg-sidebar)",
    minWidth: 280,
  },
  historyTabs: {
    display: "flex",
    padding: "8px 12px 0 12px",
    gap: "16px",
  },
  tabBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-main)",
    padding: "6px 0",
    cursor: "pointer",
    fontSize: "14px",
  },
  historyContent: {
    flex: 1,
    overflowY: "auto",
    padding: "12px",
  },
  emptyText: {
    fontSize: "13px",
    color: "var(--text-sec)",
    textAlign: "left",
    padding: "8px 0",
  },
  historyList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  historyItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    cursor: "pointer",
    padding: "6px",
    borderRadius: "4px",
    border: "none",
    background: "transparent",
    fontFamily: "inherit",
    transition: "background-color 0.1s",
  },
  historyExpr: {
    fontSize: "12px",
    color: "var(--text-sec)",
  },
  historyRes: {
    fontSize: "20px",
    fontWeight: 600,
    color: "var(--text-main)",
  },
  memoryItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid var(--border-subtle)",
    backgroundColor: "var(--bg-btn-op)",
  },
  memoryValBtn: {
    background: "none",
    border: "none",
    fontSize: "18px",
    fontWeight: 600,
    color: "var(--text-main)",
    cursor: "pointer",
    padding: 0,
    fontFamily: "inherit",
  },
  memoryRowActions: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
  },
  memoryActionBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-sec)",
    fontSize: "11px",
    cursor: "pointer",
    padding: "4px 6px",
    borderRadius: "4px",
  },
  historyFooter: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "8px 12px",
  },
  clearBtn: {
    background: "transparent",
    border: "none",
    color: "var(--text-main)",
    padding: "8px",
    borderRadius: "4px",
    cursor: "pointer",
  },
};