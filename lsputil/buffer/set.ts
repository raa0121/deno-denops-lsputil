import { api, Denops, fn, LSP } from "../deps.ts";
import { isPositionBefore, normalizeBufnr } from "../internal/util.ts";
import { toUtf8Index } from "../offset_encoding/mod.ts";
import { checkRange, LSPRangeError } from "../range/mod.ts";

/**
 * Sets (replaces) a range in the buffer
 *
 * Both rows and columns are 0-based, columns are the number of UTF-16 code units
 *
 * To insert text at a given `(row, column)` location, use `start_row =
 * end_row = row` and `start_col = end_col = col`. To delete the text in a
 * range, use `replacement = {}`.
 */
export async function setText(
  denops: Denops,
  bufnr: number,
  range: LSP.Range,
  replacement: string[],
): Promise<void> {
  if (isPositionBefore(range.end, range.start)) {
    throw new LSPRangeError(`'start' is higher than 'end'`);
  }
  bufnr = await normalizeBufnr(denops, bufnr);

  /** 1-based */
  const {
    startRow,
    endRow,
    startLine,
    endLine,
  } = await checkRange(denops, bufnr, range);

  if (denops.meta.host === "nvim") {
    const startCol = toUtf8Index(startLine, range.start.character, "utf-16");
    const endCol = toUtf8Index(endLine, range.end.character, "utf-16");
    // 0-based
    // Extmarks will be preserved on non-modified parts of the touched lines.
    await api.nvim_buf_set_text(
      denops,
      bufnr,
      startRow - 1,
      startCol,
      endRow - 1,
      endCol,
      replacement,
    );
  } else {
    // Store cursor position
    const cursor = await fn.getpos(denops, ".");
    if (replacement.length === 0) {
      replacement = [
        startLine.slice(0, range.start.character) +
        endLine.slice(range.end.character),
      ];
    } else {
      replacement = [...replacement];
      replacement[0] = startLine.slice(0, range.start.character) +
        replacement[0];
      replacement[replacement.length - 1] += endLine.slice(range.end.character);
    }
    // Deleting the lines first may create an extra blank line.
    await fn.appendbufline(denops, bufnr, endRow, replacement);
    await fn.deletebufline(denops, bufnr, startRow, endRow);
    // Restore cursor position
    await fn.setpos(denops, ".", cursor);
  }
}