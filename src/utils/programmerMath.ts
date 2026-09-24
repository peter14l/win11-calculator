export type WordSize = "QWORD" | "DWORD" | "WORD" | "BYTE";

export interface ProgrammerState {
  value: bigint; // Internal value is always unsigned matching the word size mask
  wordSize: WordSize;
  isSigned: boolean;
}

export function getBitWidth(wordSize: WordSize): bigint {
  switch (wordSize) {
    case "QWORD": return 64n;
    case "DWORD": return 32n;
    case "WORD": return 16n;
    case "BYTE": return 8n;
  }
}

export function getMask(wordSize: WordSize): bigint {
  const width = getBitWidth(wordSize);
  return (1n << width) - 1n;
}

export function truncateToWordSize(val: bigint, wordSize: WordSize): bigint {
  const mask = getMask(wordSize);
  return val & mask;
}

export function toSigned(val: bigint, wordSize: WordSize): bigint {
  const width = getBitWidth(wordSize);
  const mask = getMask(wordSize);
  const unsignedVal = val & mask;
  const signBit = 1n << (width - 1n);
  
  if ((unsignedVal & signBit) !== 0n) {
    return unsignedVal - (1n << width);
  }
  return unsignedVal;
}

export function toUnsigned(val: bigint, wordSize: WordSize): bigint {
  const mask = getMask(wordSize);
  return val & mask;
}

export function formatString(val: bigint, base: number, wordSize: WordSize, isSigned: boolean): string {
  const mask = getMask(wordSize);
  const maskedVal = val & mask;

  if (base === 10) {
    if (isSigned) {
      const signedVal = toSigned(maskedVal, wordSize);
      return signedVal.toString(10);
    } else {
      return maskedVal.toString(10);
    }
  }

  let str = maskedVal.toString(base).toUpperCase();
  
  // Pad binary to 4-bit blocks
  if (base === 2) {
    const width = Number(getBitWidth(wordSize));
    str = str.padStart(width, "0");
    // Group by 4 bits
    const parts = [];
    for (let i = 0; i < str.length; i += 4) {
      parts.push(str.substring(i, i + 4));
    }
    return parts.join(" ");
  }

  return str;
}

export function parseString(str: string, base: number, wordSize: WordSize): bigint {
  // Remove spaces (common in BIN groupings)
  const cleaned = str.replace(/\s+/g, "");
  if (!cleaned) return 0n;

  try {
    if (base === 10) {
      // Handle potential negative decimal input
      const val = BigInt(cleaned);
      return truncateToWordSize(val, wordSize);
    }
    let val = BigInt("0x" + cleaned); // BigInt supports 0x, but for bin/oct we do custom
    if (base === 2) {
      val = BigInt("0b" + cleaned);
    } else if (base === 8) {
      val = BigInt("0o" + cleaned);
    }
    return truncateToWordSize(val, wordSize);
  } catch {
    return 0n;
  }
}

// Bitwise operations
export function bitwiseAnd(a: bigint, b: bigint, wordSize: WordSize): bigint {
  return truncateToWordSize(a & b, wordSize);
}

export function bitwiseOr(a: bigint, b: bigint, wordSize: WordSize): bigint {
  return truncateToWordSize(a | b, wordSize);
}

export function bitwiseXor(a: bigint, b: bigint, wordSize: WordSize): bigint {
  return truncateToWordSize(a ^ b, wordSize);
}

export function bitwiseNot(a: bigint, wordSize: WordSize): bigint {
  return truncateToWordSize(~a, wordSize);
}

export function shiftLeft(a: bigint, shift: bigint, wordSize: WordSize): bigint {
  const width = getBitWidth(wordSize);
  if (shift >= width || shift < 0n) return 0n;
  return truncateToWordSize(a << shift, wordSize);
}

export function shiftRight(a: bigint, shift: bigint, wordSize: WordSize, isSigned: boolean): bigint {
  const width = getBitWidth(wordSize);
  if (shift >= width || shift < 0n) {
    const result = isSigned && shift >= 0n && toSigned(a, wordSize) < 0n ? -1n : 0n;
    return truncateToWordSize(result, wordSize);
  }
  if (isSigned) {
    const signedA = toSigned(a, wordSize);
    const result = signedA >> shift;
    return truncateToWordSize(result, wordSize);
  } else {
    return truncateToWordSize(a >> shift, wordSize);
  }
}
