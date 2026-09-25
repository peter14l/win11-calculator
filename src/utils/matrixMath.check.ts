import {
  createMatrix,
  formatMatrix,
  identity,
  matAdd,
  matDet,
  matInverse,
  matMul,
  matScalar,
  matSub,
  matTrace,
  matTranspose,
  parseMatrix,
} from "./matrixMath.ts";
import type { Matrix } from "../types";

let failed = 0;
const eq = (got: string | number | null | Matrix, want: string | number | null, name: string) => {
  const g = typeof got === "object" && got !== null ? formatMatrix(got) : String(got);
  const w = typeof want === "object" && want !== null ? formatMatrix(want) : String(want);
  if (g !== w) {
    console.error(`\x1b[31;1mFAIL ${name}: got ${g}, want ${w}\x1b[0m`);
    failed++;
  }
};

const A: Matrix = { rows: 2, cols: 2, cells: [1, 2, 3, 4] };
const B: Matrix = { rows: 2, cols: 2, cells: [5, 6, 7, 8] };

eq(matAdd(A, B), { rows: 2, cols: 2, cells: [6, 8, 10, 12] }, "add 2x2");
eq(matSub(A, B), { rows: 2, cols: 2, cells: [-4, -4, -4, -4] }, "sub 2x2");
eq(matMul(A, B), { rows: 2, cols: 2, cells: [19, 22, 43, 50] }, "mul 2x2");
eq(matMul(A, { rows: 2, cols: 1, cells: [1, 2] }), { rows: 2, cols: 1, cells: [5, 11] }, "mul 2x2*2x1");
eq(matMul(A, B).rows, 2, "mul dims");
eq(matScalar(A, 2), { rows: 2, cols: 2, cells: [2, 4, 6, 8] }, "scalar");
eq(matTranspose(A), { rows: 2, cols: 2, cells: [1, 3, 2, 4] }, "transpose");
eq(matTrace(A), 5, "trace");
eq(matDet(A), -2, "det");
eq(matDet(identity(3)), 1, "det identity");
eq(matInverse(A), { rows: 2, cols: 2, cells: [-2, 1, 1.5, -0.5] }, "inverse");
eq(matInverse(A) && matMul(A, matInverse(A) as Matrix), identity(2), "A * A^-1 = I");
eq(matInverse({ rows: 2, cols: 2, cells: [1, 2, 2, 4] }), null, "singular inverse null");
eq(matMul(A, { rows: 3, cols: 2, cells: [1, 2, 3, 4, 5, 6] }), null, "mismatch mul null");
eq(matAdd(A, { rows: 2, cols: 3, cells: [1, 2, 3, 4, 5, 6] }), null, "mismatch add null");
eq(formatMatrix(A), "[[1, 2], [3, 4]]", "format");
eq(parseMatrix("[[1,2],[3,4]]") && formatMatrix(parseMatrix("[[1,2],[3,4]]") as Matrix), "[[1, 2], [3, 4]]", "parse roundtrip");
eq(parseMatrix("[[1,2,3],[4,5,6]]") && (parseMatrix("[[1,2,3],[4,5,6]]") as Matrix).cols, 3, "parse cols");
eq(parseMatrix("[[1,2],[3]]"), null, "parse ragged null 1");
eq(parseMatrix("bogus"), null, "parse bogus null");
eq(parseMatrix("[[a,b],[c,d]]"), null, "parse nonnum null");
eq(createMatrix(2, 3, 7).cells.join(","), "7,7,7,7,7,7", "createMatrix");

if (failed > 0) {
  console.error(`\x1b[31;1m${failed} FAILURES\x1b[0m`);
  process.exit(1);
}
console.log("matrixMath.check: ALL PASS");