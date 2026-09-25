export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
}

export interface Matrix {
  rows: number;
  cols: number;
  cells: number[];
}

export type MemoryValue = number | Matrix;

export type AngleMode = "DEG" | "RAD" | "GRAD";

export type HistoryTab = "history" | "memory";

export type ThemePref = "light" | "dark" | "system";

export interface MemoryApi {
  store(v: MemoryValue): void;
  clear(): void;
  add(v: number): void;
  subtract(v: number): void;
  removeAt(i: number): void;
  addAt(i: number, v: number): void;
  subtractAt(i: number, v: number): void;
}

export const isNumberMem = (v: MemoryValue): v is number => typeof v === "number";

export const uid = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;