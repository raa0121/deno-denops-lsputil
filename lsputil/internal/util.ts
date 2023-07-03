import { Denops, fn, LSP, op } from "../deps.ts";

const ENCODER = new TextEncoder();
export function byteLength(
  s: string,
): number {
  return ENCODER.encode(s).length;
}

export async function normalizeBufnr(
  denops: Denops,
  bufnr: number,
): Promise<number> {
  bufnr = bufnr === 0 ? await fn.bufnr(denops) : bufnr;
  await fn.bufload(denops, bufnr);
  await op.buflisted.setBuffer(denops, bufnr, true);
  return bufnr;
}

/**
 * Returns true if position 'a' is before or at the same position as 'b'.
 */
export function isPositionBefore(
  a: LSP.Position,
  b: LSP.Position,
): boolean {
  return a.line < b.line ||
    (a.line === b.line && a.character <= b.character);
}

export function createRange(
  startLine: number,
  startCharacter: number,
  endLine: number,
  endCharacter: number,
): LSP.Range {
  return {
    start: { line: startLine, character: startCharacter },
    end: { line: endLine, character: endCharacter },
  };
}
