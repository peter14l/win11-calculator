import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyScalarBinary,
  entryToReal,
  formatExpression,
  formatNumber,
  formatScalar,
  groupEntry,
  isFrac,
  lastTopLevelOp,
  rDiv,
  rMul,
  rNeg,
  toNum,
  tryEvaluate,
} from "../utils/expressionEngine";
import type { BinOp, EvalOpts, FuncName, Scalar, Tok } from "../utils/expressionEngine";

export interface EngineOptions {
  angle: "DEG" | "RAD" | "GRAD";
  grouping: boolean;
  flat: boolean;
  fractions: boolean;
  complex: boolean;
  onResult?: (expression: string, result: string) => void;
}

function entryToToken(ent: string): Tok | null {
  const r = entryToReal(ent);
  if (r === null) return null;
  const tok: Tok = { kind: "num", value: toNum(r) };
  if (isFrac(r)) tok.frac = r;
  if (ent.includes("/")) tok.raw = ent;
  return tok;
}

function commitEntry(
  toks: Tok[],
  ent: string,
  ju: boolean,
): { toks: Tok[]; ent: string; ju: boolean } {
  if (!ent) return { toks, ent, ju };
  const tok = entryToToken(ent);
  if (tok === null) return { toks: [...toks], ent: "", ju: false };
  return { toks: [...toks, tok], ent: "", ju: false };
}

function scalarToToken(s: Scalar): Tok {
  return { kind: "num", value: toNum(s.re), ...(isFrac(s.re) ? { frac: s.re } : {}) };
}

function expectingOperand(toks: Tok[]): boolean {
  if (toks.length === 0) return true;
  const last = toks[toks.length - 1];
  return last.kind === "op" || last.kind === "lparen";
}

function wrapOperand(toks: Tok[], name: FuncName, ans: Scalar | null): Tok[] {
  const arg = ans ?? { re: 0, im: 0 };
  const func: Tok = { kind: "func", name };
  const lp: Tok = { kind: "lparen" };
  const rp: Tok = { kind: "rparen" };
  if (toks.length === 0) {
    return [func, lp, scalarToToken(arg), rp];
  }
  const last = toks[toks.length - 1];
  if (last.kind === "num" || last.kind === "const") {
    return [
      ...toks.slice(0, -1),
      func,
      lp,
      last,
      rp,
    ];
  }
  if (last.kind === "rparen") {
    let depth = 0;
    let open = -1;
    for (let i = toks.length - 1; i >= 0; i--) {
      const t = toks[i];
      if (t.kind === "rparen") depth++;
      else if (t.kind === "lparen") {
        depth--;
        if (depth === 0) {
          open = i;
          break;
        }
      }
    }
    if (open >= 0) {
      return [...toks.slice(0, open), func, lp, ...toks.slice(open), rp];
    }
  }
  return [...toks, func, lp, scalarToToken(arg), rp];
}

function computeRepeat(
  toks: Tok[],
  opts: EvalOpts,
): { op: BinOp; rhs: Scalar } | null {
  const i = lastTopLevelOp(toks);
  if (i === -1) return null;
  const opTok = toks[i];
  if (opTok.kind !== "op" || opTok.unary) return null;
  const rhs = tryEvaluate(toks.slice(i + 1), opts);
  if (!rhs.ok) return null;
  return { op: opTok.op, rhs: rhs.value };
}

export function useCalculatorEngine(opts: EngineOptions) {
  const [tokens, setTokens] = useState<Tok[]>([]);
  const [entry, setEntry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ans, setAns] = useState<Scalar | null>(null);
  const [justEval, setJustEval] = useState(false);
  const repeatRef = useRef<{ op: BinOp; rhs: Scalar } | null>(null);
  const optsRef = useRef<EngineOptions>(opts);
  const ansRef = useRef(ans);

  useEffect(() => {
    optsRef.current = opts;
    ansRef.current = ans;
  }, [opts, ans]);

  const evalOpts = (): EvalOpts => {
    const o = optsRef.current;
    return { angle: o.angle, flat: o.flat, complex: o.complex, fractions: o.fractions };
  };

  const doCommitResult = (v: Scalar) => {
    setAns(v);
    setEntry(formatScalar(v, { grouping: false, fractions: optsRef.current.fractions }));
    setTokens([]);
    setJustEval(true);
  };

  const latchError = (msg: string) => {
    setError(msg);
    setTokens([]);
    setEntry("");
    setJustEval(false);
  };

  const inputDigit = (d: string) => {
    if (error) return;
    if (justEval) {
      setTokens([]);
      setEntry(d);
      setJustEval(false);
      return;
    }
    if (entry === "") {
      setEntry(d);
      return;
    }
    if (entry.replace(/\D/g, "").length >= 16) return;
    setEntry(entry + d);
  };

  const inputDecimal = () => {
    if (error) return;
    if (justEval) {
      setTokens([]);
      setEntry("0.");
      setJustEval(false);
      return;
    }
    if (entry === "") {
      setEntry("0.");
    } else if (!entry.includes(".") && !entry.includes("e") && !entry.includes("/")) {
      setEntry(entry + ".");
    }
  };

  const inputExp = () => {
    if (error) return;
    if (entry === "") {
      if (justEval) setJustEval(false);
      setEntry("1e");
      return;
    }
    if (/^[-.\d]+$/.test(entry)) setEntry(entry + "e");
  };

  const aOverB = () => {
    if (error) return;
    if (justEval) {
      setTokens([]);
      setEntry("1/");
      setJustEval(false);
      return;
    }
    if (entry.includes("/")) return;
    if (entry === "" || entry === "-") {
      setEntry("1/");
      return;
    }
    if (!/^-?[\d.]+$/.test(entry)) return;
    setEntry(entry + "/");
  };

  const operator = (op: BinOp) => {
    if (error) return;
    let toks = tokens;
    const hadEntry = entry !== "";
    if (hadEntry || justEval) {
      toks = commitEntry(toks, entry, justEval).toks;
    }
    const last = toks[toks.length - 1];
    if (last && last.kind === "op") {
      toks = [...toks.slice(0, -1), { kind: "op", op, unary: false }];
    } else if (!hadEntry && expectingOperand(toks)) {
      if (op === "-") {
        toks = [...toks, { kind: "op", op: "-", unary: true }];
      }
    } else if (!(last && last.kind === "lparen") || hadEntry) {
      toks = [...toks, { kind: "op", op, unary: false }];
    }
    setTokens(toks);
    setEntry("");
    setJustEval(false);
  };

  const equals = () => {
    if (error) return;
    if (justEval) {
      const rep = repeatRef.current;
      if (!rep || ansRef.current === null) return;
      try {
        const r = applyScalarBinary(ansRef.current, rep.rhs, rep.op, optsRef.current.complex);
        doCommitResult(r);
      } catch (e) {
        latchError(e instanceof Error ? e.message : "Invalid input");
      }
      return;
    }
    const toks = commitEntry(tokens, entry, justEval).toks;
    if (toks.length === 0) return;
    const res = tryEvaluate(toks, evalOpts());
    if (!res.ok) {
      if (!res.incomplete) latchError(res.error || "Invalid input");
      return;
    }
    repeatRef.current = computeRepeat(toks, evalOpts());
    opts.onResult?.(
      formatExpression(toks),
      formatScalar(res.value, { grouping: false, fractions: opts.fractions }),
    );
    doCommitResult(res.value);
  };

  const percent = () => {
    if (error) return;
    const toks = tokens;
    let cur: ReturnType<typeof entryToReal>;
    let raw: string;
    if (entry !== "") {
      cur = entryToReal(entry);
      if (cur === null) return;
      raw = entry;
    } else {
      const prev = tryEvaluate(toks, evalOpts());
      cur = prev.ok ? prev.value.re : null;
      if (cur === null) cur = ansRef.current ? ansRef.current.re : 0;
      raw = formatScalar({ re: cur, im: 0 }, { grouping: false, fractions: true });
    }
    let pct = rDiv(cur, 100);
    const i = lastTopLevelOp(toks);
    if (i !== -1) {
      const opTok = toks[i];
      if (opTok.kind === "op" && !opTok.unary) {
        const left = tryEvaluate(toks.slice(0, i), evalOpts());
        if (left.ok) pct = rMul(left.value.re, pct);
      }
    }
    const tok: Tok = { kind: "num", value: toNum(pct), raw: `${raw}%` };
    if (isFrac(pct)) tok.frac = pct;
    setTokens([...toks, tok]);
    setEntry("");
    setJustEval(false);
  };

  const negate = () => {
    if (error) return;
    if (entry !== "") {
      if (entry.endsWith("e")) {
        setEntry(entry + "-");
      } else if (entry.startsWith("-")) {
        setEntry(entry.slice(1));
      } else {
        setEntry("-" + entry);
      }
      setJustEval(false);
      return;
    }
    const prev = tryEvaluate(tokens, evalOpts());
    const v: Scalar = prev.ok
      ? prev.value
      : ansRef.current ?? { re: 0, im: 0 };
    const neg: Scalar = toNum(v.im) === 0
      ? { re: rNeg(v.re), im: 0 }
      : v;
    setEntry(formatScalar(neg, { grouping: false, fractions: optsRef.current.fractions }));
    setJustEval(false);
  };

  const backspace = () => {
    if (error) {
      setError(null);
      return;
    }
    if (justEval) {
      if (entry.length > 1) {
        setEntry(entry.slice(0, -1));
        setJustEval(false);
      } else {
        setEntry("");
        setTokens([]);
        setJustEval(false);
      }
      return;
    }
    if (entry !== "") {
      setEntry(entry.slice(0, -1));
      return;
    }
    if (tokens.length > 0) setTokens(tokens.slice(0, -1));
  };

  const clear = () => {
    setTokens([]);
    setEntry("");
    setError(null);
    setAns(null);
    setJustEval(false);
    repeatRef.current = null;
    ansRef.current = null;
  };

  const clearEntry = () => {
    setEntry("");
    setError(null);
    setJustEval(false);
  };

  const parenOpen = () => {
    if (error) return;
    const toks = commitEntry(tokens, entry, justEval).toks;
    setTokens([...toks, { kind: "lparen" }]);
    setEntry("");
    setJustEval(false);
  };

  const parenClose = () => {
    if (error) return;
    const toks = commitEntry(tokens, entry, justEval).toks;
    let depth = 0;
    for (const t of toks) {
      if (t.kind === "lparen") depth++;
      else if (t.kind === "rparen") depth--;
    }
    if (depth <= 0) return;
    setTokens([...toks, { kind: "rparen" }]);
    setEntry("");
    setJustEval(false);
  };

  const func = (name: FuncName) => {
    if (error) return;
    if (entry !== "" || justEval) {
      const toks = commitEntry(tokens, entry, justEval).toks;
      setTokens(wrapOperand(toks, name, ansRef.current));
      setEntry("");
      setJustEval(false);
      return;
    }
    setTokens(wrapOperand(tokens, name, ansRef.current));
    setJustEval(false);
  };

  const constant = (c: "pi" | "e" | "i") => {
    if (error) return;
    let toks = justEval ? [] : tokens;
    toks = commitEntry(toks, entry, justEval).toks;
    setTokens([...toks, { kind: "const", value: c }]);
    setEntry("");
    setJustEval(false);
  };

  const recallAns = () => {
    if (error || ans === null) return;
    let toks = justEval ? [] : tokens;
    toks = commitEntry(toks, entry, justEval).toks;
    setTokens([...toks, scalarToToken(ans)]);
    setEntry("");
    setJustEval(false);
  };

  const loadValue = (v: number) => {
    setError(null);
    setTokens([]);
    setEntry(formatNumber(v, false));
    setJustEval(false);
    repeatRef.current = null;
  };

  const preview = useMemo(() => {
    if (entry !== "") return null;
    if (tokens.length === 0) return null;
    return tryEvaluate(tokens, {
      angle: opts.angle,
      flat: opts.flat,
      complex: opts.complex,
      fractions: opts.fractions,
    });
  }, [tokens, entry, opts.angle, opts.flat, opts.complex, opts.fractions]);

  const displayText = useMemo(() => {
    if (error) return error;
    if (entry !== "") return opts.grouping ? groupEntry(entry) : entry;
    if (preview && preview.ok) {
      return formatScalar(preview.value, { grouping: opts.grouping, fractions: opts.fractions });
    }
    if (ans !== null) {
      return formatScalar(ans, { grouping: opts.grouping, fractions: opts.fractions });
    }
    return "0";
  }, [error, entry, preview, ans, opts.grouping, opts.fractions]);

  const exprText = useMemo(() => {
    const base = formatExpression(tokens);
    if (entry !== "") {
      return base + (opts.grouping ? groupEntry(entry) : entry);
    }
    return base;
  }, [tokens, entry, opts.grouping]);

  const pendingOpIdx = useMemo(() => lastTopLevelOp(tokens), [tokens]);

  const rawNumber = displayText.replace(/,/g, "");

  const activeNumber = (() => {
    if (entry !== "") {
      const r = entryToReal(entry);
      return r === null ? NaN : toNum(r);
    }
    if (tokens.length === 0 && ans !== null) return toNum(ans.re);
    if (preview && preview.ok) return toNum(preview.value.re);
    return NaN;
  })();

  return {
    tokens,
    entry,
    error,
    ans,
    justEval,
    displayText,
    exprText,
    rawNumber,
    activeNumber,
    preview,
    pendingOpIdx,
    inputDigit,
    inputDecimal,
    inputExp,
    aOverB,
    operator,
    equals,
    percent,
    negate,
    backspace,
    clear,
    clearEntry,
    parenOpen,
    parenClose,
    func,
    constant,
    recallAns,
    loadValue,
  };
}

export type CalculatorEngine = ReturnType<typeof useCalculatorEngine>;