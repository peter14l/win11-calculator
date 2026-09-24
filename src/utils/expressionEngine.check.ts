import {
  evaluate,
  formatNumber,
  tryEvaluate,
} from "./expressionEngine.ts";
import type { Tok } from "./expressionEngine.ts";

function n(v: number): Tok {
  return { kind: "num", value: v };
}
const o = (op: "×" | "+" | "-" | "^"): Tok => ({ kind: "op", op, unary: false });
const ng: Tok = { kind: "op", op: "-", unary: true };
const lp: Tok = { kind: "lparen" };
const rp: Tok = { kind: "rparen" };
const f = (name: "sin" | "ln" | "tan"): Tok => ({ kind: "func", name });
const pi: Tok = { kind: "const", value: "pi" };

const DEG = { angle: "DEG" as const, flat: false };
const DEG_FLAT = { angle: "DEG" as const, flat: true };

let failures = 0;
function eq(actual: number, expected: number, label: string) {
  if (Math.abs(actual - expected) > 1e-9) {
    failures++;
    console.error(`FAIL ${label}: got ${actual}, want ${expected}`);
  }
}
function err(tokens: Tok[], label: string) {
  try {
    evaluate(tokens, DEG);
    failures++;
    console.error(`FAIL ${label}: expected error`);
  } catch {
    /* expected */
  }
}
function str(actual: string, expected: string, label: string) {
  if (actual !== expected) {
    failures++;
    console.error(`FAIL ${label}: got "${actual}", want "${expected}"`);
  }
}

// precedence
eq(evaluate([n(2), o("+"), n(3), o("×"), n(4)], DEG), 14, "2+3*4=14");
eq(evaluate([n(2), o("+"), n(3), o("×"), n(4)], DEG_FLAT), 20, "flat 2+3*4=20");
eq(evaluate([lp, n(2), o("+"), n(3), rp, o("×"), n(4)], DEG), 20, "(2+3)*4=20");
eq(evaluate([n(2), o("^"), n(3), o("^"), n(2)], DEG), 512, "2^3^2=512");
eq(evaluate([ng, n(2), o("^"), n(2)], DEG), -4, "-2^2=-4");
eq(evaluate([n(2), o("^"), ng, n(3)], DEG), 0.125, "2^-3=0.125");
eq(evaluate([n(2), o("×"), ng, n(3)], DEG), -6, "2*-3=-6");
eq(evaluate([n(1), o("+"), n(5), o("×"), n(3), o("-"), n(1)], DEG), 15, "1+5*3-1=15");
eq(evaluate([f("sin"), lp, n(30), rp], DEG), 0.5, "sin(30)DEG=0.5");
eq(evaluate([f("sin"), lp, n(0.5), rp], DEG), Math.sin((0.5 * Math.PI) / 180), "sin(0.5)DEG");
eq(evaluate([n(50), o("+"), n(2), o("×"), n(3)], DEG), 56, "50+2*3=56");
eq(evaluate([n(7), { kind: "op", op: "mod", unary: false }, n(3)], DEG), 1, "7 mod 3");
eq(evaluate([n(3), { kind: "op", op: "root", unary: false }, n(8)], DEG), 2, "3 yroot 8");
eq(evaluate([n(8), { kind: "op", op: "÷", unary: false }, n(2), o("+"), n(1)], DEG), 5, "8/2+1=5");
eq(evaluate([f("sin"), lp, pi, rp], DEG), Math.sin((Math.PI * Math.PI) / 180), "sin(pi)");
eq(evaluate([f("tan"), lp, n(45), rp], DEG), 1, "tan(45)=1 (near)");

// errors
err([n(1), { kind: "op", op: "÷", unary: false }, n(0)], "div by zero");
err([f("ln"), lp, n(0), rp], "ln(0)");
err([f("tan"), lp, n(90), rp], "tan(90) DEG");

// incomplete
{
  const r = tryEvaluate([n(2), o("+")], DEG);
  if (r.ok || !r.incomplete) {
    failures++;
    console.error("FAIL trailing-op must be incomplete");
  }
}

// formatting
str(formatNumber(0.1 + 0.2, false), "0.3", "fmt 0.1+0.2");
str(formatNumber(1234567.891, true), "1,234,567.891", "fmt grouping");
str(formatNumber(0.0000000000001, false), "1e-13", "fmt tiny exp");
str(formatNumber(1e16, false), "1e+16", "fmt large exp");
str(formatNumber(-0, false), "0", "fmt negative zero");
str(formatNumber(1 / 0, false), "∞", "fmt infinity");

if (failures === 0) {
  console.log("engine checks: ALL PASSED");
} else {
  throw new Error(`engine checks: ${failures} FAILED`);
}