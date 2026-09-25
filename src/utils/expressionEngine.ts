import type { AngleMode } from "../types";

export type BinOp = "+" | "-" | "×" | "÷" | "^" | "mod" | "root";

export type FuncName =
  | "sin" | "cos" | "tan" | "asin" | "acos" | "atan"
  | "sinh" | "cosh" | "tanh" | "asinh" | "acosh" | "atanh"
  | "ln" | "log" | "sqrt" | "abs" | "fact"
  | "sqr" | "cube" | "cbrt" | "rcp" | "exp" | "pow10"
  | "conj" | "re" | "im" | "arg";

// Exact fraction (gcd-reduced, n,d safe integers, d > 0)
export type Frac = { n: number; d: number };
// number = float (imprecise); Frac = exact rational
export type Real = number | Frac;
// re/im are independent Reals so e.g. 1/3 + (2/3)i stays exact
export type Scalar = { re: Real; im: Real };

export type Tok =
  | { kind: "num"; value: number; raw?: string; frac?: Frac }
  | { kind: "const"; value: "pi" | "e" | "i" }
  | { kind: "func"; name: FuncName }
  | { kind: "op"; op: BinOp; unary: boolean }
  | { kind: "var"; name: "x" }
  | { kind: "lparen" }
  | { kind: "rparen" };

export interface EvalOpts {
  angle: AngleMode;
  flat: boolean;
  complex: boolean;
  fractions: boolean;
  x?: number;
}

export class CalcError extends Error {
  incomplete: boolean;
  constructor(message: string, incomplete = false) {
    super(message);
    this.incomplete = incomplete;
  }
}

const PI = Math.PI;
const FRAC_OUT_D = 100000;

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

// ---- Rational core -------------------------------------------------------

export const isFrac = (v: Real): v is Frac => typeof v === "object" && v !== null;

export function toNum(v: Real): number {
  return isFrac(v) ? v.n / v.d : v;
}

function numToFrac(v: number): Frac | null {
  if (!Number.isInteger(v) || !Number.isSafeInteger(v)) return null;
  return v === 0 ? { n: 0, d: 1 } : { n: v, d: 1 };
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

function reduce(n: number, d: number): Frac {
  if (d === 0) return { n: n, d: 0 }; // never used with 0
  if (n === 0) return { n: 0, d: 1 };
  const g = gcd(n, d);
  const N = n / g;
  const D = d / g;
  return D < 0 ? { n: -N, d: -D } : { n: N, d: D };
}

function addFrac(a: Frac, b: Frac): Real {
  const n = a.n * b.d + b.n * a.d;
  const d = a.d * b.d;
  if (Number.isSafeInteger(n) && Number.isSafeInteger(d)) return reduce(n, d);
  return a.n / a.d + b.n / b.d;
}

function subFrac(a: Frac, b: Frac): Real {
  const n = a.n * b.d - b.n * a.d;
  const d = a.d * b.d;
  if (Number.isSafeInteger(n) && Number.isSafeInteger(d)) return reduce(n, d);
  return a.n / a.d - b.n / b.d;
}

function mulFrac(a: Frac, b: Frac): Real {
  const n = a.n * b.n;
  const d = a.d * b.d;
  if (Number.isSafeInteger(n) && Number.isSafeInteger(d)) return reduce(n, d);
  return (a.n * b.n) / (a.d * b.d);
}

function divFrac(a: Frac, b: Frac): Real {
  if (b.n === 0) throw new CalcError("Cannot divide by zero");
  const n = a.n * b.d;
  const d = a.d * b.n;
  if (Number.isSafeInteger(n) && Number.isSafeInteger(d)) return reduce(n, d);
  return (a.n * b.d) / (a.d * b.n);
}

// Exact where both operands are rational/int, float otherwise
export function rAdd(a: Real, b: Real): Real {
  if (isFrac(a) && isFrac(b)) return addFrac(a, b);
  const fa = isFrac(a) ? a : numToFrac(a);
  const fb = isFrac(b) ? b : numToFrac(b);
  if (fa && fb) return addFrac(fa, fb);
  return toNum(a) + toNum(b);
}

export function rSub(a: Real, b: Real): Real {
  if (isFrac(a) && isFrac(b)) return subFrac(a, b);
  const fa = isFrac(a) ? a : numToFrac(a);
  const fb = isFrac(b) ? b : numToFrac(b);
  if (fa && fb) return subFrac(fa, fb);
  return toNum(a) - toNum(b);
}

export function rMul(a: Real, b: Real): Real {
  if (isFrac(a) && isFrac(b)) return mulFrac(a, b);
  const fa = isFrac(a) ? a : numToFrac(a);
  const fb = isFrac(b) ? b : numToFrac(b);
  if (fa && fb) return mulFrac(fa, fb);
  return toNum(a) * toNum(b);
}

export function rDiv(a: Real, b: Real): Real {
  if (isFrac(a) && isFrac(b)) return divFrac(a, b);
  const fa = isFrac(a) ? a : numToFrac(a);
  const fb = isFrac(b) ? b : numToFrac(b);
  if (fa && fb) return divFrac(fa, fb);
  if (toNum(b) === 0) throw new CalcError("Cannot divide by zero");
  return toNum(a) / toNum(b);
}

export function rNeg(a: Real): Real {
  if (isFrac(a)) return { n: -a.n, d: a.d };
  return -a;
}

function isZeroReal(v: Real): boolean {
  return toNum(v) === 0;
}

function fracIntPow(f: Frac, exp: number): Real {
  const neg = exp < 0;
  if (f.n === 0) return neg ? Infinity : 0;
  const e = Math.abs(exp);
  if (e > 100000) return Math.pow(toNum(f), exp);
  let n = 1;
  let d = 1;
  for (let i = 0; i < e; i++) {
    n *= f.n;
    d *= f.d;
  }
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d)) return Math.pow(toNum(f), exp);
  if (neg) return reduce(d, n);
  return reduce(n, d);
}

// ---- Scalar helpers ------------------------------------------------------

function realToScalar(v: Real): Scalar {
  return { re: v, im: 0 };
}

function isPureReal(s: Scalar): boolean {
  return isZeroReal(s.im);
}

const toRe = (s: Scalar): number => toNum(s.re);
const toIm = (s: Scalar): number => toNum(s.im);

function sAdd(a: Scalar, b: Scalar): Scalar {
  return { re: rAdd(a.re, b.re), im: rAdd(a.im, b.im) };
}

function sSub(a: Scalar, b: Scalar): Scalar {
  return { re: rSub(a.re, b.re), im: rSub(a.im, b.im) };
}

function sMul(a: Scalar, b: Scalar): Scalar {
  const ac = rMul(a.re, b.re);
  const bd = rMul(a.im, b.im);
  return {
    re: rSub(ac, bd),
    im: rAdd(rMul(a.re, b.im), rMul(a.im, b.re)),
  };
}

function sDiv(a: Scalar, b: Scalar): Scalar {
  const den = rAdd(rMul(b.re, b.re), rMul(b.im, b.im));
  if (toNum(den) === 0) throw new CalcError("Cannot divide by zero");
  return {
    re: rDiv(rAdd(rMul(a.re, b.re), rMul(a.im, b.im)), den),
    im: rDiv(rSub(rMul(a.im, b.re), rMul(a.re, b.im)), den),
  };
}

function sNeg(a: Scalar): Scalar {
  return { re: rNeg(a.re), im: rNeg(a.im) };
}

function cMag(s: Scalar): number {
  return Math.hypot(toRe(s), toIm(s));
}

function cArg(s: Scalar): number {
  return Math.atan2(toIm(s), toRe(s));
}

function cExpFloat(z: Scalar): Scalar {
  const x = toRe(z);
  const y = toIm(z);
  const e = Math.exp(x);
  return { re: e * Math.cos(y), im: e * Math.sin(y) };
}

function cLnFloat(z: Scalar): Scalar {
  const mag = cMag(z);
  if (mag === 0) throw new CalcError("Invalid input");
  return { re: Math.log(mag), im: cArg(z) };
}

function cPowFloat(b: Scalar, e: Scalar): Scalar {
  if (isPureReal(b) && isPureReal(e)) {
    const br = toRe(b);
    const er = toRe(e);
    if (br >= 0 || !Number.isInteger(er)) return { re: Math.pow(br, er), im: 0 };
    const odd = Math.abs(er) % 2 === 1;
    return { re: (odd ? -1 : 1) * Math.pow(Math.abs(br), er), im: 0 };
  }
  if (isZeroReal(b.re) && isZeroReal(b.im)) {
    if (toRe(e) === 0) throw new CalcError("Invalid input");
    return { re: 0, im: 0 }; // 0^e for e != 0
  }
  return cExpFloat(sMul(e, cLnFloat(b)));
}

// Real pow with complex-agnostic exact path for rational base + integer exponent
function realPow(a: Real, b: Real): Real {
  const be = toNum(b);
  if (isFrac(a) && Number.isInteger(be) && Number.isSafeInteger(be)) {
    return fracIntPow(a, be);
  }
  if (!isFrac(a)) {
    const fa = numToFrac(a);
    if (fa && Number.isInteger(be) && Number.isSafeInteger(be)) return fracIntPow(fa, be);
  }
  if (isFrac(a) && Math.abs(be) === 0.5) {
    const n = Math.sqrt(a.n);
    const d = Math.sqrt(a.d);
    if (Number.isInteger(n) && Number.isInteger(d)) {
      return be > 0 ? reduce(n, d) : reduce(d, n);
    }
  }
  return Math.pow(toNum(a), toNum(b));
}

function realSqrt(r: Real): Real {
  if (isFrac(r)) {
    const n = Math.sqrt(r.n);
    const d = Math.sqrt(r.d);
    if (Number.isInteger(n) && Number.isInteger(d)) return reduce(n, d);
    return Math.sqrt(toNum(r));
  }
  return Math.sqrt(r);
}

// ---- Entry parsing -------------------------------------------------------

export function entryToReal(entry: string): Real | null {
  if (!entry) return null;
  if (entry.includes("/")) {
    const parts = entry.split("/");
    if (parts.length !== 2) return null;
    const [ns, ds] = parts;
    if (!ns || !ds) return null;
    const n = parseFloat(ns);
    const d = parseFloat(ds);
    if (Number.isNaN(n) || Number.isNaN(d) || d === 0) return null;
    const nf = decimalToReal(ns);
    const df = decimalToReal(ds);
    if (nf !== null && df !== null) return rDiv(nf, df);
    return n / d;
  }
  return decimalToReal(entry);
}

// exact rational for integer/decimal strings, float for exponent form
export function decimalToReal(s: string): Real | null {
  const trim = s.trim();
  if (!trim) return null;
  if (trim.includes("e") || trim.includes("E")) {
    const v = parseFloat(trim);
    return Number.isNaN(v) ? null : v;
  }
  const m = /^(-?)(\d+)?(?:\.(\d+))?$/.exec(trim);
  if (!m) return null;
  const [, sign, int, frac] = m;
  const intPart = int ?? "0";
  const fracPart = frac ?? "";
  const digits = intPart + fracPart;
  const scale = Math.pow(10, fracPart.length);
  const n = Number.parseInt(sign + digits, 10);
  if (fracPart.length === 0) {
    if (!Number.isSafeInteger(n)) return parseFloat(trim);
    return n === 0 ? { n: 0, d: 1 } : { n: n, d: 1 };
  }
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(scale)) return parseFloat(trim);
  return reduce(n, scale);
}

// ---- Functions -----------------------------------------------------------

function factorial(n: number): number {
  if (n < 0 || !Number.isInteger(n)) throw new CalcError("Invalid input");
  if (n > 170) return Infinity;
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function applyRealFunction(name: FuncName, v: Real, angle: AngleMode): Real {
  const rad = toRadians(toNum(v), angle);
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
      if (toNum(v) < -1 || toNum(v) > 1) throw new CalcError("Invalid input");
      return fromRadians(Math.asin(toNum(v)), angle);
    case "acos":
      if (toNum(v) < -1 || toNum(v) > 1) throw new CalcError("Invalid input");
      return fromRadians(Math.acos(toNum(v)), angle);
    case "atan":
      return fromRadians(Math.atan(toNum(v)), angle);
    case "sinh":
      return Math.sinh(toNum(v));
    case "cosh":
      return Math.cosh(toNum(v));
    case "tanh":
      return Math.tanh(toNum(v));
    case "asinh":
      return Math.asinh(toNum(v));
    case "acosh":
      if (toNum(v) < 1) throw new CalcError("Invalid input");
      return Math.acosh(toNum(v));
    case "atanh":
      if (toNum(v) <= -1 || toNum(v) >= 1) throw new CalcError("Invalid input");
      return Math.atanh(toNum(v));
    case "ln":
      if (toNum(v) <= 0) throw new CalcError("Invalid input");
      return Math.log(toNum(v));
    case "log":
      if (toNum(v) <= 0) throw new CalcError("Invalid input");
      return Math.log10(toNum(v));
    case "sqrt":
      if (toNum(v) < 0) throw new CalcError("Invalid input");
      return realSqrt(v);
    case "abs":
      if (isFrac(v)) return { n: Math.abs(v.n), d: v.d };
      return Math.abs(v);
    case "fact":
      return factorial(toNum(v));
    case "sqr":
      if (isFrac(v)) {
        const n = v.n * v.n;
        const d = v.d * v.d;
        if (Number.isSafeInteger(n) && Number.isSafeInteger(d)) return reduce(n, d);
      }
      return toNum(v) * toNum(v);
    case "cube":
      if (isFrac(v)) {
        const n = v.n * v.n * v.n;
        const d = v.d * v.d * v.d;
        if (Number.isSafeInteger(n) && Number.isSafeInteger(d)) return reduce(n, d);
      }
      return toNum(v) * toNum(v) * toNum(v);
    case "cbrt":
      return Math.cbrt(toNum(v));
    case "rcp":
      if (toNum(v) === 0) throw new CalcError("Cannot divide by zero");
      if (isFrac(v)) return { n: v.d, d: v.n };
      return 1 / toNum(v);
    case "exp":
      return Math.exp(toNum(v));
    case "pow10":
      return Math.pow(10, toNum(v));
    case "conj":
    case "re":
    case "arg":
      return v;
    case "im":
      return 0;
  }
}

function applyComplexFunction(name: FuncName, z: Scalar, angle: AngleMode): Scalar {
  if (isPureReal(z)) {
    try {
      return realToScalar(applyRealFunction(name, z.re, angle));
    } catch {
      // real domain error -> fall through to complex implementation
    }
  }
  switch (name) {
    case "abs":
      return realToScalar(cMag(z));
    case "arg":
      return realToScalar(cArg(z));
    case "conj":
      return { re: z.re, im: rNeg(z.im) };
    case "re":
      return realToScalar(z.re);
    case "im":
      return realToScalar(z.im);
    case "exp":
      return cExpFloat(z);
    case "ln":
      return cLnFloat(z);
    case "log": {
      const l = cLnFloat(z);
      return { re: toRe(l) / Math.LN10, im: toIm(l) / Math.LN10 };
    }
    case "sqrt":
      return cExpFloat(sMul(realToScalar(0.5), cLnFloat(z)));
    case "sin":
      return complexSin(z);
    case "cos":
      return complexCos(z);
    case "tan": {
      const t = complexTan(z);
      if (toNum(t.re) === 0 && toNum(t.im) === 0) throw new CalcError("Invalid input");
      return t;
    }
    case "rcp":
      return sDiv(realToScalar(1), z);
    case "sqr":
      return sMul(z, z);
    case "cube":
      return sMul(sMul(z, z), z);
    case "pow10":
      return cExpFloat(sMul(z, realToScalar(Math.LN10)));
    default:
      throw new CalcError("Invalid input");
  }
}

// sin(z) = (e^(iz) - e^(-iz)) / (2i), cos(z) = (e^(iz) + e^(-iz)) / 2
function complexSin(z: Scalar): Scalar {
  const iz = { re: rNeg(z.im), im: z.re };
  const e1 = cExpFloat(iz);
  const e2 = cExpFloat(sNeg(iz));
  const diff = sSub(e1, e2);
  return sDiv(diff, { re: 0, im: 2 });
}

function complexCos(z: Scalar): Scalar {
  const iz = { re: rNeg(z.im), im: z.re };
  const e1 = cExpFloat(iz);
  const e2 = cExpFloat(sNeg(iz));
  return { re: (toRe(e1) + toRe(e2)) / 2, im: (toIm(e1) + toIm(e2)) / 2 };
}

function complexTan(z: Scalar): Scalar {
  const iz = { re: rNeg(z.im), im: z.re };
  const e1 = cExpFloat(iz);
  const e2 = cExpFloat(sNeg(iz));
  const num = sSub(e1, e2);
  const den = sAdd(e1, e2);
  return sDiv(sMul(num, { re: 0, im: 1 }), den);
}

function applyFunction(name: FuncName, v: Scalar, opts: EvalOpts): Scalar {
  if (opts.complex) return applyComplexFunction(name, v, opts.angle);
  const r = applyRealFunction(name, v.re, opts.angle);
  return realToScalar(r);
}

function applyBinary(a: Scalar, b: Scalar, op: BinOp, complex: boolean): Scalar {
  const r = (() => {
    if (complex) {
      switch (op) {
        case "+": return sAdd(a, b);
        case "-": return sSub(a, b);
        case "×": return sMul(a, b);
        case "÷": return sDiv(a, b);
        case "^": return cPowFloat(a, b);
        case "root":
        case "mod":
          throw new CalcError("Invalid input");
      }
    }
    switch (op) {
      case "+": return realToScalar(rAdd(a.re, b.re));
      case "-": return realToScalar(rSub(a.re, b.re));
      case "×": return realToScalar(rMul(a.re, b.re));
      case "÷": return realToScalar(rDiv(a.re, b.re));
      case "^": return realToScalar(realPow(a.re, b.re));
      case "root":
        if (toNum(a.re) === 0) return realToScalar(b.re);
        return realToScalar(Math.pow(toNum(b.re), 1 / toNum(a.re)));
      case "mod":
        if (toNum(b.re) === 0) throw new CalcError("Cannot divide by zero");
        return realToScalar(toNum(a.re) % toNum(b.re));
    }
  })();
  if (Number.isNaN(toRe(r)) || Number.isNaN(toIm(r))) throw new CalcError("Invalid input");
  return r;
}

export function applyScalarBinary(a: Scalar, b: Scalar, op: BinOp, complex: boolean): Scalar {
  return applyBinary(a, b, op, complex);
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
      case "var":
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

export function evaluate(tokens: Tok[], opts: EvalOpts): Scalar {
  const rpn = shunting(balanceParens(tokens), opts.flat);
  const stack: Scalar[] = [];
  for (const t of rpn) {
    switch (t.kind) {
      case "num":
        stack.push(t.frac ? realToScalar(t.frac) : realToScalar(t.value));
        break;
      case "const":
        if (t.value === "i") {
          if (!opts.complex) throw new CalcError("Invalid input");
          stack.push({ re: 0, im: 1 });
        } else {
          stack.push(realToScalar(t.value === "pi" ? PI : Math.E));
        }
        break;
      case "var":
        stack.push(realToScalar(opts.x ?? 0));
        break;
      case "func": {
        const a = stack.pop();
        if (a === undefined) throw new CalcError("incomplete", true);
        stack.push(applyFunction(t.name, a, opts));
        break;
      }
      case "op": {
        const b = stack.pop();
        if (b === undefined) throw new CalcError("incomplete", true);
        if (t.unary) {
          stack.push(sNeg(b));
          break;
        }
        const a = stack.pop();
        if (a === undefined) throw new CalcError("incomplete", true);
        stack.push(applyBinary(a, b, t.op, opts.complex));
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
  | { ok: true; value: Scalar }
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

// ---- Formatting ----------------------------------------------------------

const FUNC_LABELS: Record<string, string> = {
  sin: "sin", cos: "cos", tan: "tan",
  asin: "sin⁻¹", acos: "cos⁻¹", atan: "tan⁻¹",
  sinh: "sinh", cosh: "cosh", tanh: "tanh",
  asinh: "sinh⁻¹", acosh: "cosh⁻¹", atanh: "tanh⁻¹",
  ln: "ln", log: "log", sqrt: "√",
  abs: "|x|", fact: "fact", sqr: "sqr", cube: "cube",
  cbrt: "∛", rcp: "1/x", exp: "eˣ", pow10: "10ˣ",
  conj: "conj", re: "Re(", im: "Im(", arg: "arg(",
};

function formatFracInput(s: string): string {
  const m = s.match(/^(-?\d+)\/(\d+)$/);
  if (!m) return s;
  const [, num, den] = m;
  const gn = num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const gd = den.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${gn}/${gd}`;
}

export function formatExpression(tokens: Tok[]): string {
  let s = "";
  for (const t of tokens) {
    switch (t.kind) {
      case "num":
        if (t.raw) s += formatFracInput(t.raw);
        else if (t.frac && t.frac.d === 1) s += formatNumber(t.frac.n, false);
        else if (t.frac) s += formatFrac(t.frac);
        else s += formatNumber(t.value, false);
        break;
      case "const":
        s += t.value === "pi" ? "π" : t.value === "e" ? "e" : "i";
        break;
      case "var":
        s += "x";
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
  const m = entry.match(/^(-?)(\d*)(\.\d*)?(\/\d*)?(e[-+]?\d*)?$/);
  if (!m) return entry;
  const [, sign, int, frac, dens, exp] = m;
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  let den = "";
  if (dens) {
    den = dens.replace(/\d+/, (g) => g.replace(/\B(?=(\d{3})+(?!\d))/g, ","));
  }
  return sign + grouped + (frac ?? "") + den + (exp ?? "");
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

export function formatFrac(f: Frac): string {
  const sign = f.n < 0 ? "-" : "";
  return `${sign}${Math.abs(f.n)}/${f.d}`;
}

function formatReal(r: Real, opts: { grouping?: boolean; fractions?: boolean }): string {
  if (isFrac(r)) {
    if (r.d === 1) return formatNumber(r.n, opts.grouping);
    if (opts.fractions !== false && Math.abs(r.d) <= FRAC_OUT_D) {
      return formatFrac(r);
    }
    return formatNumber(toNum(r), opts.grouping);
  }
  return formatNumber(r, opts.grouping);
}

export interface FormatScalarOpts {
  grouping?: boolean;
  fractions?: boolean;
}

export function formatScalar(s: Scalar, opts: FormatScalarOpts = {}): string {
  // clean tiny floating-point noise (e.g. exp(i*pi) => -1 + 6e-17 i)
  let { re, im } = s;
  const scale = Math.max(1, Math.abs(toNum(re)), Math.abs(toNum(im)));
  if (!isFrac(re) && re !== 0 && Math.abs(toNum(re)) < 1e-12 * scale) re = 0;
  if (!isFrac(im) && im !== 0 && Math.abs(toNum(im)) < 1e-12 * scale) im = 0;

  const imZero = isZeroReal(im);
  if (imZero) {
    const reZero = isZeroReal(re);
    return reZero ? "0" : formatReal(re, opts);
  }

  const imNum = toIm({ re, im });
  const imSign = imNum < 0 ? "-" : "+";
  const imCoeff = (() => {
    const mag = Math.abs(imNum);
    if ((isFrac(im) && im.d === 1 && Math.abs(im.n) === 1) || (!isFrac(im) && mag === 1)) return "";
    const base = isFrac(im) ? formatFrac({ n: Math.abs(im.n), d: im.d }) : formatNumber(mag, false);
    return isFrac(im) ? `(${base})` : base;
  })();
  const imStr = imCoeff === "" ? "i" : `${imCoeff}i`;

  if (isZeroReal(re)) return imSign === "-" ? `-${imStr}` : imStr;
  const reStr = formatReal(re, opts);
  return `${reStr} ${imSign === "+" ? "+" : "−"} ${imStr}`;
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