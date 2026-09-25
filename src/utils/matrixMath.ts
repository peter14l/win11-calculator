import type { Matrix } from "../types";

export function createMatrix(rows: number, cols: number, fill = 0): Matrix {
  return { rows, cols, cells: Array.from({ length: rows * cols }, () => fill) };
}

export function identity(n: number): Matrix {
  return {
    rows: n,
    cols: n,
    cells: Array.from({ length: n * n }, (_, i) => (i % (n + 1) === 0 ? 1 : 0)),
  };
}

export const cloneMat = (m: Matrix): Matrix => ({ rows: m.rows, cols: m.cols, cells: [...m.cells] });

const sameDims = (a: Matrix, b: Matrix) => a.rows === b.rows && a.cols === b.cols;

export function matAdd(a: Matrix, b: Matrix): Matrix | null {
  if (!sameDims(a, b)) return null;
  return { rows: a.rows, cols: a.cols, cells: a.cells.map((v, i) => v + b.cells[i]) };
}

export function matSub(a: Matrix, b: Matrix): Matrix | null {
  if (!sameDims(a, b)) return null;
  return { rows: a.rows, cols: a.cols, cells: a.cells.map((v, i) => v - b.cells[i]) };
}

export function matMul(a: Matrix, b: Matrix): Matrix | null {
  if (a.cols !== b.rows) return null;
  const cells: number[] = [];
  for (let r = 0; r < a.rows; r++) {
    for (let c = 0; c < b.cols; c++) {
      let s = 0;
      for (let k = 0; k < a.cols; k++) s += a.cells[r * a.cols + k] * b.cells[k * b.cols + c];
      cells.push(s);
    }
  }
  return { rows: a.rows, cols: b.cols, cells };
}

export function matScalar(m: Matrix, s: number): Matrix {
  return { rows: m.rows, cols: m.cols, cells: m.cells.map((v) => v * s) };
}

export function matTranspose(m: Matrix): Matrix {
  const cells: number[] = [];
  for (let c = 0; c < m.cols; c++) for (let r = 0; r < m.rows; r++) cells.push(m.cells[r * m.cols + c]);
  return { rows: m.cols, cols: m.rows, cells };
}

export function matTrace(m: Matrix): number | null {
  if (m.rows !== m.cols) return null;
  let s = 0;
  for (let i = 0; i < m.rows; i++) s += m.cells[i * m.rows + i];
  return s;
}

const PIVOT_EPS = 1e-12;

export function matDet(m: Matrix): number | null {
  if (m.rows !== m.cols) return null;
  const n = m.rows;
  const a = [...m.cells];
  let det = 1;
  let sign = 1;
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(a[j * n + i]) > Math.abs(a[p * n + i])) p = j;
    }
    if (Math.abs(a[p * n + i]) < PIVOT_EPS) return 0;
    if (p !== i) {
      for (let k = 0; k < n; k++) {
        const t = a[i * n + k];
        a[i * n + k] = a[p * n + k];
        a[p * n + k] = t;
      }
      sign = -sign;
    }
    const piv = a[i * n + i];
    det *= piv;
    for (let j = i + 1; j < n; j++) {
      const f = a[j * n + i] / piv;
      if (f === 0) continue;
      for (let k = i; k < n; k++) a[j * n + k] -= f * a[i * n + k];
    }
  }
  return sign * det;
}

export function matInverse(m: Matrix): Matrix | null {
  if (m.rows !== m.cols) return null;
  const n = m.rows;
  const a: number[][] = Array.from({ length: n }, (_, r) => [
    ...m.cells.slice(r * n, r * n + n),
    ...Array.from({ length: n }, (_, c) => (r === c ? 1 : 0)),
  ]);
  for (let i = 0; i < n; i++) {
    let p = i;
    for (let j = i + 1; j < n; j++) {
      if (Math.abs(a[j][i]) > Math.abs(a[p][i])) p = j;
    }
    if (Math.abs(a[p][i]) < PIVOT_EPS) return null;
    if (p !== i) [a[i], a[p]] = [a[p], a[i]];
    const piv = a[i][i];
    for (let k = 0; k < 2 * n; k++) a[i][k] /= piv;
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const f = a[j][i];
      for (let k = 0; k < 2 * n; k++) a[j][k] -= f * a[i][k];
    }
  }
  const cells = a.flatMap((row) => row.slice(n, 2 * n));
  return { rows: n, cols: n, cells };
}

const fmtCell = (v: number): string => {
  if (Math.abs(v) < 1e-12) return "0";
  const s = parseFloat(v.toFixed(10)).toString();
  return /^-?\d+$/.test(s) ? s : s;
};

export function formatMatrix(m: Matrix): string {
  const rows: string[] = [];
  for (let r = 0; r < m.rows; r++) {
    rows.push("[" + m.cells.slice(r * m.cols, r * m.cols + m.cols).map(fmtCell).join(", ") + "]");
  }
  return "[" + rows.join(", ") + "]";
}

export function parseMatrix(s: string): Matrix | null {
  const inner = s.replace(/\s/g, "");
  if (!inner.startsWith("[[") || !inner.endsWith("]]")) return null;
  const body = inner.slice(2, -2);
  if (body === "") return null;
  const rowsStr = body.split("],[");
  const cells: number[] = [];
  let cols = 0;
  for (const rs of rowsStr) {
    const parts = rs.split(",");
    if (parts.length === 1 && parts[0] === "") return null;
    if (cols === 0) cols = parts.length;
    else if (parts.length !== cols) return null;
    for (const p of parts) {
      const v = Number(p);
      if (p === "" || Number.isNaN(v)) return null;
      cells.push(v);
    }
  }
  return { rows: rowsStr.length, cols, cells };
}