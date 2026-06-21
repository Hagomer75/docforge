// Spreadsheet parsing. SheetJS reads CSV, XLSX and XLS from a single buffer,
// so the same code path serves every upload the UI accepts.
import * as XLSX from "xlsx";

export type ParsedSheet = {
  columns: string[];
  rows: Record<string, string>[];
};

export function parseSpreadsheet(buffer: Buffer): ParsedSheet {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("The file has no sheets.");
  }
  const sheet = wb.Sheets[firstSheetName];

  // defval keeps empty cells as "" so every row has the full column set.
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });

  if (raw.length === 0) {
    throw new Error("No data rows found below the header.");
  }

  const columns = Object.keys(raw[0]).filter((c) => c && !c.startsWith("__EMPTY"));
  if (columns.length === 0) {
    throw new Error("Could not read a header row from the file.");
  }

  const rows = raw.map((r) => {
    const out: Record<string, string> = {};
    for (const col of columns) {
      const val = r[col];
      out[col] = val == null ? "" : String(val).trim();
    }
    return out;
  });

  return { columns, rows };
}
