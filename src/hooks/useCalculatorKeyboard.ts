import { useEffect, useRef } from "react";

export interface KeyHandlers {
  digit(d: string): void;
  decimal(): void;
  op(op: string): void;
  equals(): void;
  backspace(): void;
  clear(): void;
  clearEntry?(): void;
  percent?(): void;
  parenOpen?(): void;
  parenClose?(): void;
  exp?(): void;
  negate?(): void;
  letter?(c: string): void;
}

export function useCalculatorKeyboard(enabled: boolean, handlers: KeyHandlers) {
  const ref = useRef(handlers);

  useEffect(() => {
    ref.current = handlers;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "SELECT" ||
          target.tagName === "TEXTAREA")
      ) {
        return;
      }
      const h = ref.current;
      const key = e.key;
      if (h.letter && /^[a-fA-F]$/.test(key)) {
        h.letter(key);
      } else if (/^[0-9]$/.test(key)) {
        h.digit(key);
      } else if (key === ".") {
        h.decimal();
      } else if (key === "+") {
        e.preventDefault();
        h.op("+");
      } else if (key === "-") {
        e.preventDefault();
        h.op("-");
      } else if (key === "*") {
        e.preventDefault();
        h.op("×");
      } else if (key === "/") {
        e.preventDefault();
        h.op("÷");
      } else if (key === "(") {
        h.parenOpen?.();
      } else if (key === ")") {
        h.parenClose?.();
      } else if (key === "Enter" || key === "=") {
        e.preventDefault();
        h.equals();
      } else if (key === "Backspace") {
        e.preventDefault();
        h.backspace();
      } else if (key === "Escape") {
        e.preventDefault();
        h.clear();
      } else if (key === "Delete") {
        h.clearEntry?.();
      } else if (key === "%") {
        h.percent?.();
      } else if (key === "e" || key === "E") {
        h.exp?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}