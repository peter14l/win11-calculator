import {
  entryToReal,
  evaluate,
  formatScalar,
  isFrac,
  toNum,
  tryEvaluate,
} from "./expressionEngine.ts";
import type { EvalOpts, Tok } from "./expressionEngine.ts";
import { parseExpression } from "./expressionParser.ts";

function n(v: number, raw?: string): Tok {
  const tok: Tok = { kind: "num", value: v };
  if (raw !== undefined) {
    const r = entryToReal(raw);
    if (r !== null && isFrac(r)) tok.frac = r;
  }
  return tok;
}
const o = (op: "×" | "+" | "-" | "^"): Tok => ({ kind: "op", op, unary: false });
const lp: Tok = { kind: "lparen" };
const rp: Tok = { kind: "rparen" };
const f = (name: "sin" | "ln" | "tan" | "sqrt"): Tok => ({ kind: "func", name });
const pi: Tok = { kind: "const", value: "pi" };

const RE = { angle: "RAD" as const, flat: false, complex: false, fractions: true };
const RE_DEG = { angle: "DEG" as const, flat: false, complex: false, fractions: true };
const RE_FLAT = { angle: "DEG" as const, flat: true, complex: false, fractions: true };
const CX = { angle: "DEG" as const, flat: false, complex: true, fractions: true };

let failures = 0;
function val(tokens: Tok[], opts: EvalOpts): number {
  const r = tryEvaluate(tokens, opts);
  if (!r.ok) {
    failures++;
    console.error(`FAIL eval ${JSON.stringify(tokens)}: ${r.error}`);
    return NaN;
  }
  return toNum(r.value.re);
}
function fmt(tokens: Tok[], opts: EvalOpts): string {
  const r = tryEvaluate(tokens, opts);
  if (!r.ok) {
    failures++;
    console.error(`FAIL fmt ${JSON.stringify(tokens)}: ${r.error}`);
    return "?";
  }
  return formatScalar(r.value);
}
function eq(actual: number, expected: number, label: string) {
  if (Number.isNaN(actual) || Number.isNaN(expected)) {
    if (!(Number.isNaN(actual) && Number.isNaN(expected))) {
      failures++;
      console.error(`FAIL ${label}: got ${actual}, want ${expected}`);
    }
    return;
  }
  if (Math.abs(actual - expected) > 1e-9) {
    failures++;
    console.error(`FAIL ${label}: got ${actual}, want ${expected}`);
  }
}
function str(actual: string, expected: string, label: string) {
  if (actual !== expected) {
    failures++;
    console.error(`FAIL ${label}: got "${actual}", want "${expected}"`);
  }
}
function err(tokens: Tok[], label: string) {
  try {
    evaluate(tokens, RE);
    failures++;
    console.error(`FAIL ${label}: expected error`);
  } catch {
    /* expected */
  }
}

// basic arithmetic
eq(val([n(2), o("+"), n(3)], RE), 5, "2+3");
eq(val([n(2), o("+"), n(3), o("×"), n(4)], RE), 14, "2+3*4");
eq(val([n(6), o("+"), n(2), o("-"), n(1)], RE), 7, "6+2-1"); // flat=false: equal precedence left assoc
eq(val([n(2), o("×"), n(3), o("+"), n(4)], RE_FLAT), 10, "flat 2*3+4");
eq(val([lp, n(2), o("+"), n(3), rp, o("×"), n(4)], RE), 20, "(2+3)*4");
eq(val([f("sin"), pi], RE), 0, "sin(pi) in RAD");
eq(val([f("tan"), n(45)], RE_DEG), 1, "tan(45) in DEG");
eq(val([n(9), { kind: "op", op: "^", unary: false }, n(0.5)], RE), 3, "9^0.5");

// exact fractions
eq(val([n(1, "1/3"), o("+"), n(1, "1/6")], RE), 0.5, "1/3+1/6");
eq(val([n(2, "2/4")], RE), 0.5, "2/4 = 1/2");
eq(val([n(1, "1/3"), o("+"), n(0.5)], RE), 5 / 6, "1/3+0.5 exact");
eq(val([n(1, "1/2"), o("×"), n(2, "2/3")], RE), 1 / 3, "1/2*2/3");
eq(val([n(1, "1/2"), { kind: "op", op: "÷", unary: false }, n(3, "1/3")], RE), 3 / 2, "1/2 / 1/3");
eq(val([n(1, "1/3"), o("×"), n(3)], RE), 1, "1/3*3");
eq(val([n(5, "5/7"), o("+"), n(1, "2/7")], RE), 1, "5/7+2/7");

console.log("entryToReal('1/3')", toNum(entryToReal("1/3")!));
console.log("entryToReal('0.5')", toNum(entryToReal("0.5")!));
console.log("entryToReal('3')", toNum(entryToReal("3")!));

// scale back into overall/format tests
str(fmt([n(1, "1/3"), o("+"), n(1, "1/6")], RE), "1/2", "float 1/3+1/6 fmt");
// division by zero
err([n(1, "1/2"), { kind: "op", op: "÷", unary: false }, n(0)], "1/2/0");

// complex
eq(val([n(1), o("+"), { kind: "const", value: "i" }], CX), 1, "1+i real part");
eq(val(parseExpression("(2+i)*(2-i)"), CX), 5, "(2+i)(2-i)=5");
eq(val(parseExpression("exp(i*pi)"), CX), -1, "exp(i*pi)=-1");
str(fmt(parseExpression("exp(i*pi)"), CX), "-1", "exp(i*pi) fmt");
str(fmt(parseExpression("1/3 + i"), CX), "1/3 + i", "1/3+i fmt");
str(fmt([{ kind: "op", op: "-", unary: true }, n(1)], RE), "-1", "neg display");
str(fmt([{ kind: "op", op: "-", unary: true }, n(1)], CX), "-1", "neg display cx");
console.log("sqrt(-1) complex:", fmt([f("sqrt"), n(-1)], CX)); // expect i
str(fmt([f("sqrt"), n(-1)], CX), "i", "sqrt(-1)=i in complex mode");
str(fmt(parseExpression("(1+i)/(1-i)"), CX), "i", "(1+i)/(1-i)=i");

// parser round-trips
str(fmt(parseExpression("1/3 + 1/6"), RE), "1/2", "parse 1/3 + 1/6");
eq(val(parseExpression("2*(3+4)"), RE), 14, "parse 2*(3+4)");
eq(val(parseExpression("sin(0)"), RE), 0, "parse sin(0)");
eq(val(parseExpression("-2^2"), RE), -4, "parse -2^2");
eq(val(parseExpression("2^-2"), RE), 0.25, "parse 2^-2");

if (failures === 0) {
  console.log("expressionEngine.check: ALL PASS");
} else {
  console.error(`${failures} FAILURES`);
  process.exit(1);
}