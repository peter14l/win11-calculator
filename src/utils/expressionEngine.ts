import type { AngleMode } from "../types";

export type BinOp = "+" | "-" | "×" | "÷" | "^" | "mod" | "root";

export type FuncName =
  | "sin" | "cos" | "tan" | "asin" | "acos" | "atan"
  | "sinh" | "cosh" | "tanh" | "asinh" | "acosh" | "atanh"
  | "ln" | "log" | "sqrt" | "abs" | "fact"
  | "sqr" | "cube" | "cbrt" | "rcp" | "exp" | "pow10";

export type Tok =
  | { kind: "num"; value: number; raw?: string }
  | { kind: "const"; value: "pi" | "e" }
  | { kind: "func"; name: FuncName }
  | { kind: "op"; op: BinOp; unary: boolean }
  | { kind: "lparen" }
  | { kind: "rparen" };

export interface EvalOpts {
  angle: AngleMode;
  flat: boolean;
}

export class CalcError extends Error {
  incomplete: boolean;
  constructor(message: string, incomplete = false) {
    super(message);
    this.incomplete = incomplete;
  }
}

const PI = Math.PI;

export function toRadians(v: number, angle: AngleMode): number {
  if (angle === "DEG") return (v * PI) / 180;
  if (angle === "GRAD") return (v * PI) / 200;
  return v;
}

export function fromRadians(v: number, angle: AngleMode): number {
  if (angle === "DEG") return (v * 180) / PI;
  if (angle === "GRAD") return (v * 200) / PI;
  return v;
}

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) throw new CalcError("Invalid input");
  if (n > 170) return Infinity;
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function applyFunction(name: FuncName, v: number, angle: AngleMode): number {
  const rad = toRadians(v, angle);
  switch (name) {
    case "sin":
      return Math.sin(rad);
    case "cos":
      return Math.cos(rad);
    case "tan": {
      const c = Math.cos(rad);
      if (Math.abs(c) < 1e-12) throw new CalcError("Invalid input");
      return Math.sin(rad) / c;
    }
    case "asin":
      if (v < -1 || v > 1) throw new CalcError("Invalid input");
      return fromRadians(Math.asin(v), angle);
    case "acos":
      if (v < -1 || v > 1) throw new CalcError("Invalid input");
      return fromRadians(Math.acos(v), angle);
    case "atan":
      return fromRadians(Math.atan(v), angle);
    case "sinh":
      return Math.sinh(v);
    case "cosh":
      return Math.cosh(v);
    case "tanh":
      return Math.tanh(v);
    case "asinh":
      return Math.asinh(v);
    case "acosh":
      if (v < 1) throw new CalcError("Invalid input");
      return Math.acosh(v);
    case "atanh":
      if (v <= -1 || v >= 1) throw new CalcError("Invalid input");
      return Math.atanh(v);
    case "ln":
      if (v <= 0) throw new CalcError("Invalid input");
      return Math.log(v);
    case "log":
      if (v <= 0) throw new CalcError("Invalid input");
      return Math.log10(v);
    case "sqrt":
      if (v < 0) throw new CalcError("Invalid input");
      return Math.sqrt(v);
    case "abs":
      return Math.abs(v);
    case "fact":
      return factorial(v);
    case "sqr":
      return v * v;
    case "cube":
      return v * v * v;
    case "cbrt":
      return Math.cbrt(v);
    case "rcp":
      if (v === 0) throw new CalcError("Cannot divide by zero");
      return 1 / v;
    case "exp":
      return Math.exp(v);
    case "pow10":
      return Math.pow(10, v);
  }
}

function applyBinary(a: number, b: number, op: BinOp): number {
  const r = (() => {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷":
        if (b === 0) throw new CalcError("Cannot divide by zero");
        return a / b;
      case "^": return Math.pow(a, b);
      case "root":
        if (a === 0) return b;
        return Math.pow(b, 1 / a);
      case "mod":
        if (b === 0) throw new CalcError("Cannot divide by zero");
        return a % b;
    }
  })();
  if (Number.isNaN(r)) throw new CalcError("Invalid input");
  return r;
}

function precedence(o: string, flat: boolean): number {
  if (o === "neg" || o === "^") return 5;
  if (flat) return 3;
  if (o === "×" || o === "÷" || o === "mod") return 3;
  return 2;
}

function isRightAssoc(o: string): boolean {
  return o === "neg" || o === "^";
}

function balanceParens(tokens: Tok[]): Tok[] {
  const out: Tok[] = [];
  let depth = 0;
  for (const t of tokens) {
    if (t.kind === "lparen") {
      depth++;
      out.push(t);
    } else if (t.kind === "rparen") {
      if (depth > 0) {
        depth--;
        out.push(t);
      }
    } else {
      out.push(t);
    }
  }
  for (let i = 0; i < depth; i++) out.push({ kind: "rparen" });
  return out;
}

function shunting(tokens: Tok[], flat: boolean): Tok[] {
  const out: Tok[] = [];
  const stack: Tok[] = [];

  const popOps = (p: number, right: boolean) => {
    let top = stack[stack.length - 1];
    while (top && (top.kind === "op" || top.kind === "func")) {
      const topName = top.kind === "op" ? (top.unary ? "neg" : top.op) : "";
      const topPrec = top.kind === "op" ? precedence(topName, flat) : 99;
      const shouldPop = top.kind === "func"
        ? true
        : right
          ? topPrec > p
          : topPrec >= p;
      if (!shouldPop) break;
      out.push(stack.pop() as Tok);
      top = stack[stack.length - 1];
    }
  };

  for (const t of tokens) {
    switch (t.kind) {
      case "num":
      case "const":
        out.push(t);
        break;
      case "func":
        stack.push(t);
        break;
      case "lparen":
        stack.push(t);
        break;
      case "rparen": {
        let top = stack.pop();
        while (top && top.kind !== "lparen") {
          out.push(top);
          top = stack.pop();
        }
        const next = stack[stack.length - 1];
        if (next && next.kind === "func") out.push(stack.pop() as Tok);
        break;
      }
      case "op": {
        const name = t.unary ? "neg" : t.op;
        popOps(precedence(name, flat), isRightAssoc(name));
        stack.push(t);
        break;
      }
    }
  }
  while (stack.length) {
    const t = stack.pop() as Tok;
    if (t.kind === "lparen") continue;
    out.push(t);
  }
  return out;
}

export function evaluate(tokens: Tok[], opts: EvalOpts): number {
  const rpn = shunting(balanceParens(tokens), opts.flat);
  const stack: number[] = [];
  for (const t of rpn) {
    switch (t.kind) {
      case "num":
        stack.push(t.value);
        break;
      case "const":
        stack.push(t.value === "pi" ? PI : Math.E);
        break;
      case "func": {
        const a = stack.pop();
        if (a === undefined) throw new CalcError("incomplete", true);
        stack.push(applyFunction(t.name, a, opts.angle));
        break;
      }
      case "op": {
        const b = stack.pop();
        if (b === undefined) throw new CalcError("incomplete", true);
        if (t.unary) {
          stack.push(-b);
          break;
        }
        const a = stack.pop();
        if (a === undefined) throw new CalcError("incomplete", true);
        stack.push(applyBinary(a, b, t.op));
        break;
      }
      case "lparen":
      case "rparen":
        break;
    }
  }
  if (stack.length !== 1) throw new CalcError("incomplete", true);
  return stack[0];
}

export type EvalResult =
  | { ok: true; value: number }
  | { ok: false; incomplete: boolean; error: string };

export function tryEvaluate(tokens: Tok[], opts: EvalOpts): EvalResult {
  try {
    return { ok: true, value: evaluate(tokens, opts) };
  } catch (e) {
    if (e instanceof CalcError) {
      return { ok: false, incomplete: e.incomplete, error: e.message };
    }
    return { ok: false, incomplete: true, error: "" };
  }
}

const FUNC_LABELS: Record<FuncName, string> = {
  sin: "sin", cos: "cos", tan: "tan",
  asin: "sin⁻¹", acos: "cos⁻¹", atan: "tan⁻¹",
  sinh: "sinh", cosh: "cosh", tanh: "tanh",
  asinh: "sinh⁻¹", acosh: "cosh⁻¹", atanh: "tanh⁻¹",
  ln: "ln", log: "log", sqrt: "√",
  abs: "|x|", fact: "fact", sqr: "sqr", cube: "cube",
  cbrt: "∛", rcp: "1/x", exp: "eˣ", pow10: "10ˣ",
};

export function formatExpression(tokens: Tok[]): string {
  let s = "";
  for (const t of tokens) {
    switch (t.kind) {
      case "num":
        s += t.raw ?? formatNumber(t.value, false);
        break;
      case "const":
        s += t.value === "pi" ? "π" : "e";
        break;
      case "func":
        s += `${FUNC_LABELS[t.name]}(`;
        break;
      case "op":
        if (t.unary) {
          s += "-";
        } else {
          s += t.op === "^" ? " ^ " : t.op === "root" ? " ʸ√ " : ` ${t.op} `;
        }
        break;
      case "lparen":
        s += "(";
        break;
      case "rparen":
        s += ")";
        break;
    }
  }
  return s;
}

export function groupInteger(str: string): string {
  const m = str.match(/^(-?)(\d+)(\.\d+)?$/);
  if (!m) return str;
  const [, sign, int, frac] = m;
  return sign + int.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (frac ?? "");
}

export function groupEntry(entry: string): string {
  const m = entry.match(/^(-?)(\d*)(\.\d*)?(e[-+]?\d*)?$/);
  if (!m) return entry;
  const [, sign, int, frac, exp] = m;
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return sign + grouped + (frac ?? "") + (exp ?? "");
}

export function formatNumber(n: number, grouping = true): string {
  if (Number.isNaN(n)) return "Error";
  if (n === Infinity) return "∞";
  if (n === -Infinity) return "-∞";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs > 1e15 || abs < 1e-12) {
    const e = n.toExponential(8).replace(/\.?0+e/, "e");
    return e;
  }
  let str = parseFloat(n.toFixed(12)).toString();
  if (grouping) str = groupInteger(str);
  return str;
}

export function lastTopLevelOp(tokens: Tok[]): number {
  let depth = 0;
  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = tokens[i];
    if (t.kind === "rparen") depth++;
    else if (t.kind === "lparen") depth--;
    else if (depth === 0 && t.kind === "op") return i;
  }
  return -1;
}