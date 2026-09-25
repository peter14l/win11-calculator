import {
  decimalToReal,
  isFrac,
  toNum,
} from "./expressionEngine.ts";
import type { FuncName, Tok } from "./expressionEngine.ts";

const FUNCS = new Set([
  "sin", "cos", "tan", "asin", "acos", "atan",
  "sinh", "cosh", "tanh", "asinh", "acosh", "atanh",
  "ln", "log", "sqrt", "abs", "exp",
]);

const NUM_RE = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/;
const ID_RE = /^[a-zA-Z]+/;

function valueStart(last: Tok | undefined): boolean {
  return last !== undefined && (last.kind === "num" || last.kind === "const" || last.kind === "rparen");
}

export function parseExpression(input: string): Tok[] {
  const out: Tok[] = [];
  const s = input;
  let i = 0;

  const expectOperand = (): boolean => {
    const last = out[out.length - 1];
    return out.length === 0 || last.kind === "op" || last.kind === "lparen";
  };

  const pushMaybeMul = () => {
    const last = out[out.length - 1];
    if (valueStart(last)) out.push({ kind: "op", op: "×", unary: false });
  };

  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    const rest = s.slice(i);

    const num = NUM_RE.exec(rest);
    if (num) {
      pushMaybeMul();
      const r = decimalToReal(num[0]);
      const tok: Tok = { kind: "num", value: r === null ? parseFloat(num[0]) : toNum(r) };
      if (r !== null && isFrac(r)) tok.frac = r;
      out.push(tok);
      i += num[0].length;
      continue;
    }

    if (c === "(") {
      pushMaybeMul();
      out.push({ kind: "lparen" });
      i++;
      continue;
    }
    if (c === ")") {
      out.push({ kind: "rparen" });
      i++;
      continue;
    }
    if (c === "+" || c === "-") {
      if (c === "-" && expectOperand()) {
        out.push({ kind: "op", op: "-", unary: true });
      } else {
        out.push({ kind: "op", op: c, unary: false });
      }
      i++;
      continue;
    }
    if (c === "*") {
      out.push({ kind: "op", op: "×", unary: false });
      i++;
      continue;
    }
    if (c === "×" || c === "÷" || c === "/" || c === "^") {
      const opMap: Record<string, Extract<Tok, { kind: "op" }>["op"]> = { "×": "×", "÷": "÷", "/": "÷", "^": "^" };
      out.push({ kind: "op", op: opMap[c], unary: false });
      i++;
      continue;
    }

    const id = ID_RE.exec(rest);
    if (id) {
      const name = id[0].toLowerCase();
      const full = name.length === id[0].length ? name : name; // case-insensitive match
      if (FUNCS.has(full)) {
        pushMaybeMul();
        out.push({ kind: "func", name: full as FuncName });
        i += id[0].length;
        while (i < s.length && /\s/.test(s[i])) i++;
        if (s[i] !== "(") throw new Error("Invalid expression");
        out.push({ kind: "lparen" });
        i++;
        continue;
      }
      if (full === "pi" || full === "e" || full === "i") {
        pushMaybeMul();
        out.push({ kind: "const", value: full });
        i += id[0].length;
        continue;
      }
      if (full === "x") {
        pushMaybeMul();
        out.push({ kind: "var", name: "x" });
        i += id[0].length;
        continue;
      }
      throw new Error("Invalid expression");
    }

    throw new Error("Invalid expression");
  }

  return out;
}

export function isCompleteExpression(tokens: Tok[]): boolean {
  let depth = 0;
  for (const t of tokens) {
    if (t.kind === "lparen") depth++;
    else if (t.kind === "rparen") depth--;
  }
  if (depth !== 0) return false;
  const last = tokens[tokens.length - 1];
  return last !== undefined && (last.kind === "num" || last.kind === "const" || last.kind === "rparen" || last.kind === "var");
}