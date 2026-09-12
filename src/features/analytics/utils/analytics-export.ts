import type { ExportRow } from "../types";

/** Escape one CSV field (RFC 4180): quote when it contains separators or line
 *  breaks, double inner quotes. Unicode (accents, Arabic) is preserved. */
export function csvEscape(value: string): string {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Build a UTF-8 CSV body. Data values keep their exact text. */
export function buildScansCsv(
  rows: ExportRow[],
  headers: {
    qrName: string;
    qrType: string;
    scannedAt: string;
    device: string;
    operatingSystem: string;
    browser: string;
  }
): string {
  const head = [
    headers.qrName,
    headers.qrType,
    headers.scannedAt,
    headers.device,
    headers.operatingSystem,
    headers.browser,
  ];
  const lines = [
    head.map(csvEscape).join(","),
    ...rows.map((r) =>
      [r.qrName, r.qrType, r.scannedAt, r.device, r.operatingSystem, r.browser]
        .map(csvEscape)
        .join(",")
    ),
  ];
  // BOM marker: Excel/LibreOffice then detect UTF-8 (accents, Arabic).
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

const EXPORT_ROW_KEYS: (keyof ExportRow)[] = [
  "qrName",
  "qrType",
  "scannedAt",
  "device",
  "operatingSystem",
  "browser",
];

function isValidExportRow(row: unknown): row is ExportRow {
  if (!row || typeof row !== "object") return false;
  const candidate = row as Record<string, unknown>;
  return EXPORT_ROW_KEYS.every((k) => typeof candidate[k] === "string");
}

/** Validate rows before preparing an export (refuses malformed data). */
export function validateExportRows(rows: unknown): ExportRow[] {
  if (!Array.isArray(rows)) throw new Error("invalid_export_rows");
  const result: ExportRow[] = [];
  for (const row of rows) {
    if (!isValidExportRow(row)) throw new Error("invalid_export_row");
    result.push(row);
  }
  return result;
}

/** Self-describing JSON export envelope (generatedAt, filters, data). */
export function buildExportEnvelope(
  rows: ExportRow[],
  filterRange: string,
  filterQr: string | null,
  generatedAt: string = new Date().toISOString()
): string {
  return JSON.stringify(
    {
      generatedAt,
      filters: { range: filterRange, qrId: filterQr },
      data: rows,
    },
    null,
    2
  );
}

/** Plain-text report built from already-fetched (secured) analytics data. */
export interface ReportSection {
  label: string;
  items: { name: string; value: string }[];
}

export function buildTextReport(
  title: string,
  metaLines: string[],
  sections: ReportSection[]
): string {
  const out: string[] = [title, ""];
  for (const line of metaLines) out.push(line);
  out.push("");
  for (const section of sections) {
    out.push(section.label);
    out.push("=".repeat(section.label.length));
    out.push("");
    for (const item of section.items) {
      out.push(`- ${item.name}: ${item.value}`);
    }
    out.push("");
  }
  return out.join("\r\n").replace(/\r\n+$/, "") + "\r\n";
}

/** qr-manager-analytics-<UTC date>.csv|json|txt */
export function exportFilename(kind: "csv" | "json" | "report", now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}`;
  const ext = kind === "report" ? "txt" : kind;
  return `qr-manager-analytics-${stamp}.${ext}`;
}

/** Trigger a client-side download (SSR-safe: no-op without a document). */
export function downloadTextFile(name: string, content: string, mime: string): void {
  if (typeof document === "undefined") return;
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}