import React, { useMemo, useState } from "react";
import { isNumberMem, type HistoryItem, type HistoryTab, type MemoryApi, type MemoryValue } from "../types";
import { HistorySidebar } from "./HistorySidebar";
import {
  createMatrix,
  formatMatrix,
  identity,
  matAdd,
  matDet,
  matInverse,
  matMul,
  matScalar,
  matSub,
  matTrace,
  matTranspose,
  parseMatrix,
} from "../utils/matrixMath";
import type { Matrix } from "../types";

interface MatrixCalculatorProps {
  isHistoryOpen: boolean;
  setIsHistoryOpen: (open: boolean) => void;
  historyTab: HistoryTab;
  setHistoryTab: (tab: HistoryTab) => void;
  history: HistoryItem[];
  setHistory: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  pushHistory: (expression: string, result: string) => void;
  memory: MemoryValue[];
  memoryApi: MemoryApi;
}

type Pending = { kind: "m"; m: Matrix } | { kind: "k"; value: number } | null;

const DIMS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const CellInput: React.FC<{ value: number; onChange: (v: number) => void }> = ({ value, onChange }) => (
  <input
    type="number"
    value={value}
    onChange={(e) => onChange(Number(e.target.value) || 0)}
    style={styles.cellInput}
  />
);

const MatrixGrid: React.FC<{ title: string; dim: { rows: number; cols: number }; m: Matrix; setM: (m: Matrix) => void; dims: React.ReactNode }> = ({
  title,
  dim,
  m,
  setM,
  dims,
}) => {
  const setCell = (r: number, c: number, v: number) => {
    const cells = [...m.cells];
    cells[r * dim.cols + c] = v;
    setM({ ...m, cells });
  };
  return (
    <div style={styles.matrixPanel}>
      <div style={styles.matrixHeader}>
        <span style={styles.matrixTitle}>{title}</span>
        {dims}
      </div>
      <div style={{ ...styles.cellGrid, gridTemplateColumns: `repeat(${dim.cols}, 1fr)` }}>
        {Array.from({ length: dim.rows * dim.cols }, (_, i) => (
          <CellInput key={i} value={m.cells[i] ?? 0} onChange={(v) => setCell(Math.floor(i / dim.cols), i % dim.cols, v)} />
        ))}
      </div>
    </div>
  );
};

export const MatrixCalculator: React.FC<MatrixCalculatorProps> = ({
  isHistoryOpen,
  historyTab,
  setHistoryTab,
  history,
  setHistory,
  pushHistory,
  memory,
  memoryApi,
}) => {
  const [rowsA, setRowsA] = useState(2);
  const [colsA, setColsA] = useState(2);
  const [rowsB, setRowsB] = useState(2);
  const [colsB, setColsB] = useState(2);
  const [a, setA] = useState<Matrix>(() => createMatrix(2, 2));
  const [b, setB] = useState<Matrix>(() => createMatrix(2, 2));
  const [pending, setPending] = useState<Pending>(null);
  const [error, setError] = useState(false);
  const [scalar, setScalar] = useState(2);

  const resize = (m: Matrix, rows: number, cols: number): Matrix => {
    const next = createMatrix(rows, cols);
    for (let r = 0; r < Math.min(rows, m.rows); r++)
      for (let c = 0; c < Math.min(cols, m.cols); c++) next.cells[r * cols + c] = m.cells[r * m.cols + c];
    return next;
  };

  const setResult = (m: Matrix, label: string) => {
    setError(false);
    setPending({ kind: "m", m });
    pushHistory(label, formatMatrix(m));
  };

  const setErr = () => {
    setError(true);
    setPending(null);
  };

  const setScalarResult = (v: number, label: string) => {
    setError(false);
    setPending({ kind: "k", value: v });
    pushHistory(label, String(v));
  };

  const ops: { label: string; run: () => void }[] = [
    { label: "A + B", run: () => { const r = matAdd(a, b); if (r) setResult(r, "A + B"); else setErr(); } },
    { label: "A − B", run: () => { const r = matSub(a, b); if (r) setResult(r, "A − B"); else setErr(); } },
    { label: "A × B", run: () => { const r = matMul(a, b); if (r) setResult(r, "A × B"); else setErr(); } },
    { label: "k·A", run: () => setResult(matScalar(a, scalar), "k·A") },
    { label: "Aᵀ", run: () => setResult(matTranspose(a), "Aᵀ") },
    { label: "A⁻¹", run: () => { const r = matInverse(a); if (r) setResult(r, "A⁻¹"); else setErr(); } },
    { label: "det(A)", run: () => { const r = matDet(a); if (r !== null) setScalarResult(r, "det(A)"); else setErr(); } },
    { label: "tr(A)", run: () => { const r = matTrace(a); if (r !== null) setScalarResult(r, "tr(A)"); else setErr(); } },
  ];

  const resultText = useMemo(() => {
    if (error) return "Error";
    if (pending === null) return "—";
    return pending.kind === "m" ? formatMatrix(pending.m) : String(pending.value);
  }, [pending, error]);

  const selectHistory = (result: string) => {
    const m = parseMatrix(result);
    if (m) setPending({ kind: "m", m });
  };

  const selectMemory = (v: MemoryValue) => {
    if (!isNumberMem(v)) setA(v);
  };

  const dimsFor = (which: "A" | "B") => (
    <div style={styles.dimsRow}>
      <label style={styles.dimLabel}>R</label>
      <select className="chip-btn" value={which === "A" ? rowsA : rowsB} onChange={(e) => { const v = Number(e.target.value); if (which === "A") { setRowsA(v); setA((m) => resize(m, v, colsA)); } else { setRowsB(v); setB((m) => resize(m, v, colsB)); } }}>
        {DIMS.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
      <label style={styles.dimLabel}>C</label>
      <select className="chip-btn" value={which === "A" ? colsA : colsB} onChange={(e) => { const v = Number(e.target.value); if (which === "A") { setColsA(v); setA((m) => resize(m, rowsA, v)); } else { setColsB(v); setB((m) => resize(m, rowsB, v)); } }}>
        {DIMS.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
    </div>
  );

  return (
    <div style={styles.outerContainer}>
      <div style={styles.calculatorPanel}>
        <div style={styles.matricesRow}>
          <MatrixGrid title="A" dim={{ rows: rowsA, cols: colsA }} m={a} setM={setA} dims={dimsFor("A")} />
          <MatrixGrid title="B" dim={{ rows: rowsB, cols: colsB }} m={b} setM={setB} dims={dimsFor("B")} />
        </div>

        <div style={styles.resultsRow}>
          <div style={styles.resultLabel}>Result</div>
          <div style={styles.resultValue}>{resultText}</div>
        </div>

        <div style={styles.opsGrid}>
          {ops.map((op) => (
            <button key={op.label} type="button" className="fluent-btn op-key" onClick={op.run}>
              {op.label}
            </button>
          ))}
          <button type="button" className="fluent-btn op-key" onClick={() => setA(identity(rowsA))}>
            I
          </button>
        </div>

        <div style={styles.actionRow}>
          <input
            type="number"
            value={scalar}
            onChange={(e) => setScalar(Number(e.target.value) || 0)}
            style={styles.scalarInput}
            title="Scalar k"
          />
          <button type="button" className="chip-btn" onClick={() => { if (pending?.kind === "m") memoryApi.store(pending.m); }}>
            MS
          </button>
          <button
            type="button"
            className="chip-btn"
            onClick={() => { if (memory.length > 0 && !isNumberMem(memory[0])) setA(memory[0]); }}
          >
            MR→A
          </button>
          <button
            type="button"
            className="chip-btn"
            onClick={() => { if (pending?.kind === "m") setA(pending.m); }}
          >
            A←Ans
          </button>
          <button type="button" className="chip-btn" onClick={() => { if (pending?.kind === "m") setB(pending.m); }}>
            B←Ans
          </button>
          <button type="button" className="chip-btn" onClick={() => { setError(false); setPending(null); }}>
            Clear
          </button>
        </div>

        <div style={styles.helpText}>Matrix memory entries: use MS above or the Memory tab. MR→A loads the latest saved matrix.</div>
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
        activeValue={0}
        grouping={false}
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
  matricesRow: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  matrixPanel: {
    flex: 1,
    minWidth: 200,
    maxWidth: 340,
    border: "1px solid var(--border-subtle)",
    borderRadius: 6,
    padding: 8,
    backgroundColor: "var(--bg-btn-op)",
  },
  matrixHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  matrixTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text-main)",
  },
  dimsRow: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  dimLabel: {
    fontSize: 11,
    color: "var(--text-sec)",
  },
  cellGrid: {
    display: "grid",
    gap: 4,
  },
  cellInput: {
    width: "100%",
    height: 36,
    textAlign: "center",
    fontSize: 15,
    border: "1px solid var(--border-subtle)",
    borderRadius: 4,
    backgroundColor: "var(--bg-input)",
    color: "var(--text-main)",
  },
  resultsRow: {
    margin: "10px 0",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  resultLabel: {
    fontSize: 13,
    color: "var(--text-sec)",
    minWidth: 48,
  },
  resultValue: {
    fontSize: 18,
    fontWeight: 600,
    color: "var(--text-main)",
    wordBreak: "break-all",
  },
  opsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: 2,
  },
  actionRow: {
    display: "flex",
    gap: 6,
    marginTop: 8,
    alignItems: "center",
    flexWrap: "wrap",
  },
  scalarInput: {
    width: 56,
    height: 28,
    textAlign: "center",
    border: "1px solid var(--border-subtle)",
    borderRadius: 4,
    backgroundColor: "var(--bg-input)",
    color: "var(--text-main)",
  },
  helpText: {
    marginTop: 6,
    fontSize: 11,
    color: "var(--text-sec)",
  },
};