import React, { useCallback, useEffect, useRef, useState } from "react";
import { Trash2, Eye, EyeOff } from "lucide-react";
import { usePersistentState } from "../hooks/usePersistentState";
import { parseExpression } from "../utils/expressionParser";
import { tryEvaluate, toNum } from "../utils/expressionEngine";
import type { Tok } from "../utils/expressionEngine";

const COLORS = ["#4cc2ff", "#ff9f43", "#7ed321", "#ff6b81", "#b57edc", "#f8e04f"];

interface RangeState {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

type FuncEntry = { id: string; expr: string; visible: boolean };

const mkid = () => Math.random().toString(36).slice(2, 9);

const quickKeys = [
  { label: "x", insert: "x" },
  { label: "(", insert: "(" },
  { label: ")", insert: ")" },
  { label: "sin", insert: "sin(" },
  { label: "cos", insert: "cos(" },
  { label: "tan", insert: "tan(" },
  { label: "ln", insert: "ln(" },
  { label: "√", insert: "sqrt(" },
  { label: "π", insert: "pi" },
  { label: "e", insert: "e" },
  { label: "^", insert: "^" },
  { label: "÷", insert: "/" },
  { label: "×", insert: "*" },
];

export const GraphingCalculator: React.FC = () => {
  const [funcs, setFuncs] = usePersistentState<FuncEntry[]>("calc.graph.funcs", [
    { id: mkid(), expr: "sin(x)", visible: true },
  ]);
  const [range, setRange] = usePersistentState<RangeState>("calc.graph.range", {
    xMin: -10,
    xMax: 10,
    yMin: -6,
    yMax: 6,
  });
  const [rangeText, setRangeText] = usePersistentState(
    "calc.graph.rangeText",
    JSON.stringify({ xMin: -10, xMax: 10, yMin: -6, yMax: 6 }),
  );
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const validateRange = (t: string): RangeState | null => {
    try {
      const v = JSON.parse(t) as Record<string, number>;
      const nums = ["xMin", "xMax", "yMin", "yMax"].map((k) => Number(v[k]));
      if (nums.some((n) => !Number.isFinite(n))) return null;
      const [xMin, xMax, yMin, yMax] = nums;
      if (xMin >= xMax || yMin >= yMax || xMax - xMin > 1e6 || yMax - yMin > 1e6) return null;
      return { xMin, xMax, yMin, yMax };
    } catch {
      return null;
    }
  };

  const applyRange = (t: string) => {
    const r = validateRange(t);
    if (r) {
      setRange(r);
      setRangeText(t);
      setError("");
    } else {
      setError("Invalid range: use {xMin,xMax,yMin,yMax}");
    }
  };

  const addFunc = () => {
    const expr = input.trim();
    if (!expr) return;
    try {
      parseExpression(expr);
    } catch {
      setError(`Cannot parse: ${expr}`);
      return;
    }
    setFuncs((prev) => [{ id: mkid(), expr, visible: true }, ...prev].slice(0, 4));
    setInput("");
    setError("");
  };

  const toggleFunc = (id: string) =>
    setFuncs((prev) => prev.map((f) => (f.id === id ? { ...f, visible: !f.visible } : f)));

  const removeFunc = (id: string) => setFuncs((prev) => prev.filter((f) => f.id !== id));

  const formatTick = (v: number): string => {
    const a = Math.abs(v);
    if (a >= 1e3 || (a < 1e-3 && a !== 0)) return Number(v.toExponential(1)).toExponential(0);
    return String(parseFloat(v.toFixed(3)));
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const W = wrap.clientWidth;
    const H = wrap.clientHeight;
    if (W === 0 || H === 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const { xMin, xMax, yMin, yMax } = range;
    const sx = (x: number) => ((x - xMin) / (xMax - xMin)) * W;
    const sy = (y: number) => H - ((y - yMin) / (yMax - yMin)) * H;

    const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg-app")?.trim() || "#1f1f1f";
    const gridC = getComputedStyle(document.documentElement).getPropertyValue("--border-subtle")?.trim() || "rgba(255,255,255,0.08)";
    const axisC = getComputedStyle(document.documentElement).getPropertyValue("--text-sec")?.trim() || "rgba(255,255,255,0.5)";
    const tickC = gridC;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // grid: choose a "nice" step near powers of 10 * {1,2,5}
    const niceStep = (lo: number, hi: number, maxTicks = 10) => {
      const span = hi - lo;
      const raw = span / maxTicks;
      const mag = Math.pow(10, Math.floor(Math.log10(raw)));
      const norm = raw / mag;
      const step = (norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10) * mag;
      return step;
    };
    const stepX = niceStep(xMin, xMax);
    const stepY = niceStep(yMin, yMax);

    ctx.lineWidth = 1;
    const drawGrid = (step: number, isX: boolean) => {
      const start = Math.ceil((isX ? xMin : yMin) / step) * step;
      const end = isX ? xMax : yMax;
      for (let v = start; v <= end; v += step) {
        if (Math.abs(v) < step / 1e6) continue;
        ctx.strokeStyle = gridC;
        ctx.beginPath();
        if (isX) {
          ctx.moveTo(sx(v), 0);
          ctx.lineTo(sx(v), H);
        } else {
          ctx.moveTo(0, sy(v));
          ctx.lineTo(W, sy(v));
        }
        ctx.stroke();
        // tick label
        const label = formatTick(v);
        ctx.fillStyle = tickC;
        ctx.font = "10px Segoe UI, sans-serif";
        ctx.textAlign = isX ? "center" : "right";
        ctx.textBaseline = "middle";
        if (isX) ctx.fillText(label, sx(v), sy(0) + 12);
        else ctx.fillText(label, sx(0) - 6, sy(v));
      }
    };
    drawGrid(stepX, true);
    drawGrid(stepY, false);

    // axes
    ctx.strokeStyle = axisC;
    ctx.lineWidth = 1.5;
    if (xMin <= 0 && xMax >= 0) {
      ctx.beginPath();
      ctx.moveTo(sx(0), 0);
      ctx.lineTo(sx(0), H);
      ctx.stroke();
    }
    if (yMin <= 0 && yMax >= 0) {
      ctx.beginPath();
      ctx.moveTo(0, sy(0));
      ctx.lineTo(W, sy(0));
      ctx.stroke();
    }

    // curves
    const evalAt = (toks: Tok[], x: number): number | null => {
      const opt = { angle: "RAD" as const, flat: false, complex: false, fractions: true, x };
      try {
        const r = tryEvaluate(toks, opt);
        if (!r.ok) return null;
        const v = toNum(r.value.re);
        return Number.isFinite(v) ? v : null;
      } catch {
        return null;
      }
    };

    funcs.filter((f) => f.visible).forEach((f, idx) => {
      const toks = (() => {
        try {
          return parseExpression(f.expr);
        } catch {
          return null;
        }
      })();
      if (toks === null) return;
      ctx.strokeStyle = COLORS[idx % COLORS.length];
      ctx.lineWidth = 2;
      ctx.beginPath();
      let penDown = false;
      for (let px = 0; px <= W; px++) {
        const x = xMin + (px / W) * (xMax - xMin);
        const y = evalAt(toks, x);
        if (y === null) {
          penDown = false;
          continue;
        }
        const py = sy(y);
        if (py < -1e4 || py > H + 1e4) {
          penDown = false;
          continue;
        }
        if (!penDown) {
          ctx.moveTo(px, py);
          penDown = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    });
    // restore scale for next draw (each draw rescales, but reset to avoid accumulation)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, [funcs, range]);

  useEffect(() => {
    draw();
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [draw]);

  const insert = (s: string) => setInput((prev) => prev + s);

  return (
    <div style={styles.outer}>
      <div style={styles.left}>
        <div style={styles.inputRow}>
          <input
            style={styles.input}
            value={input}
            placeholder="e.g. sin(x), x^2, sqrt(x), 1/x"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addFunc();
            }}
          />
          <button type="button" className="fluent-btn accent-key" onClick={addFunc}>
            ➕
          </button>
        </div>
        <div style={styles.quickRow}>
          {quickKeys.map((k) => (
            <button key={k.label} type="button" className="chip-btn" onClick={() => insert(k.insert)}>
              {k.label}
            </button>
          ))}
        </div>

        <div style={styles.funcList}>
          {funcs.length === 0 && <div style={styles.empty}>No functions</div>}
          {funcs.map((f, idx) => (
            <div key={f.id} style={styles.funcItem}>
              <span style={styles.funcDot}>.{COLORS[idx % COLORS.length]}.</span>
              <button
                type="button"
                style={styles.funcExpr}
                onClick={() => {
                  setInput(f.expr);
                }}
                title="Edit this expression"
              >
                {f.expr}
              </button>
              <button type="button" className="icon-btn" onClick={() => toggleFunc(f.id)} aria-label="Toggle visibility">
                {f.visible ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button type="button" className="icon-btn" onClick={() => removeFunc(f.id)} aria-label="Delete">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.rangeBox}>
          <div style={styles.rangeLabel}>View window [xMin, xMax, yMin, yMax]</div>
          <input
            style={styles.rangeInput}
            value={rangeText}
            onChange={(e) => setRangeText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyRange(rangeText);
            }}
          />
          <div style={styles.rangeActions}>
            <button
              type="button"
              className="chip-btn"
              onClick={() => {
                const t = JSON.stringify({ xMin: -10, xMax: 10, yMin: -6, yMax: 6 });
                setRangeText(t);
                applyRange(t);
              }}
            >
              Reset
            </button>
            <button
              type="button"
              className="chip-btn"
              onClick={() => {
                const t = JSON.stringify({ xMin: -2 * Math.PI, xMax: 2 * Math.PI, yMin: -2, yMax: 2 });
                setRangeText(t);
                applyRange(t);
              }}
            >
              π
            </button>
          </div>
        </div>
      </div>

      <div style={styles.right}>
        <div ref={wrapRef} style={styles.canvasWrap}>
          <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  outer: {
    flex: 1,
    display: "flex",
    height: "100%",
    width: "100%",
    overflow: "hidden",
  },
  left: {
    width: 240,
    borderRight: "1px solid var(--border-app)",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    overflowY: "auto",
  },
  inputRow: {
    display: "flex",
    gap: 6,
  },
  input: {
    flex: 1,
    height: 32,
    padding: "0 8px",
    fontSize: 14,
    border: "1px solid var(--border-subtle)",
    borderRadius: 4,
    backgroundColor: "var(--bg-input)",
    color: "var(--text-main)",
  },
  quickRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
  },
  funcList: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  empty: {
    fontSize: 13,
    color: "var(--text-sec)",
  },
  funcItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 6px",
    borderRadius: 4,
    border: "1px solid var(--border-subtle)",
  },
  funcDot: {
    fontSize: 8,
    lineHeight: "10px",
  },
  funcExpr: {
    flex: 1,
    textAlign: "left",
    background: "none",
    border: "none",
    color: "var(--text-main)",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  error: {
    fontSize: 12,
    color: "var(--text-error)",
    wordBreak: "break-word",
  },
  rangeBox: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  rangeLabel: {
    fontSize: 11,
    color: "var(--text-sec)",
  },
  rangeInput: {
    height: 30,
    padding: "0 8px",
    fontSize: 12,
    border: "1px solid var(--border-subtle)",
    borderRadius: 4,
    backgroundColor: "var(--bg-input)",
    color: "var(--text-main)",
  },
  rangeActions: {
    display: "flex",
    gap: 6,
  },
  right: {
    flex: 1,
    position: "relative",
    padding: 12,
    minWidth: 0,
  },
  canvasWrap: {
    width: "100%",
    height: "100%",
    border: "1px solid var(--border-app)",
    borderRadius: 6,
    overflow: "hidden",
  },
};