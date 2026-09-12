import { describe, it, expect } from "vitest";
import {
  csvEscape,
  buildScansCsv,
  validateExportRows,
  buildExportEnvelope,
  buildTextReport,
  exportFilename,
} from "../utils/analytics-export";
import type { ExportRow } from "../types";

const ROW: ExportRow = {
  qrName: "Menu du soir",
  qrType: "website",
  scannedAt: "2026-08-15 18:42",
  device: "mobile",
  operatingSystem: "iOS",
  browser: "Safari",
};

describe("csvEscape", () => {
  it("leaves plain values untouched", () => {
    expect(csvEscape("Menu")).toBe("Menu");
    expect(csvEscape("")).toBe("");
  });

  it("quotes values containing commas, quotes or line breaks", () => {
    expect(csvEscape('Nice "Menu"')).toBe('"Nice ""Menu"""');
    expect(csvEscape("a,b")).toBe('"a,b"');
    expect(csvEscape("a\nb")).toBe('"a\nb"');
  });

  it("preserves unicode (accents, Arabic)", () => {
    expect(csvEscape("تقرير المسح")).toBe("تقرير المسح");
    expect(csvEscape("café")).toBe("café");
  });

  it("neutralizes spreadsheet formula injection", () => {
    expect(csvEscape("=SUM(A1:A5)")).toBe("'=SUM(A1:A5)");
    expect(csvEscape("+1-1")).toBe("'+1-1");
    expect(csvEscape("-1+1")).toBe("'-1+1");
    expect(csvEscape("@SUM")).toBe("'@SUM");
    expect(csvEscape("\t=cmd")).toBe("'\t=cmd");
    // Contains a comma, so the neutralized value is also quoted.
    expect(csvEscape("=1,2")).toBe('"\'=1,2"');
    // Prefix is applied before quoting so the final cell starts with the quote.
    expect(csvEscape('=x,"quote"')).toBe('"\'=x,""quote"""');
  });

  it("does not alter values that legitimately start with a digit", () => {
    expect(csvEscape("2026-08-15")).toBe("2026-08-15");
  });
});

describe("buildScansCsv", () => {
  it("writes a UTF-8 BOM and CRLF line endings", () => {
    const csv = buildScansCsv([], {
      qrName: "QR Code",
      qrType: "Type",
      scannedAt: "Scanned at",
      device: "Device",
      operatingSystem: "OS",
      browser: "Browser",
    });
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv.endsWith("\r\n")).toBe(true);
    expect(csv).toContain("\r\n");
  });

  it("escapes fields that need quoting", () => {
    const csv = buildScansCsv(
      [{ ...ROW, qrName: 'Menu, "Spécial"' }],
      {
        qrName: "QR Code",
        qrType: "Type",
        scannedAt: "Scanned at",
        device: "Device",
        operatingSystem: "OS",
        browser: "Browser",
      }
    );
    expect(csv).toContain('"Menu, ""Spécial"""');
  });

  it("writes the header line first", () => {
    const csv = buildScansCsv([ROW], {
      qrName: "QR Code",
      qrType: "Type",
      scannedAt: "Scanned at",
      device: "Device",
      operatingSystem: "OS",
      browser: "Browser",
    });
    const lines = csv.replace("\uFEFF", "").split("\r\n");
    expect(lines[0]).toBe("QR Code,Type,Scanned at,Device,OS,Browser");
    expect(lines[1]).toBe(`${ROW.qrName},${ROW.qrType},${ROW.scannedAt},${ROW.device},${ROW.operatingSystem},${ROW.browser}`);
  });
});

describe("validateExportRows", () => {
  it("passes well-formed rows through unchanged", () => {
    const rows = validateExportRows([ROW, { ...ROW, qrName: "B" }]);
    expect(rows).toHaveLength(2);
    expect(rows[0].qrName).toBe("Menu du soir");
  });

  it("rejects non-arrays", () => {
    expect(() => validateExportRows(null)).toThrow("invalid_export_rows");
    expect(() => validateExportRows({})).toThrow("invalid_export_rows");
  });

  it("rejects malformed rows (missing / non-string fields)", () => {
    expect(() => validateExportRows([{ ...ROW, qrType: 42 }])).toThrow("invalid_export_row");
    expect(() => validateExportRows([null])).toThrow("invalid_export_row");
    expect(() => validateExportRows([{ qrName: "x" }])).toThrow("invalid_export_row");
  });
});

describe("buildExportEnvelope", () => {
  it("produces a self-describing JSON envelope", () => {
    const json = buildExportEnvelope(
      [ROW],
      "Last 30 days",
      "qr-1",
      "2026-08-15T20:00:00.000Z"
    );
    const parsed = JSON.parse(json);
    expect(parsed.generatedAt).toBe("2026-08-15T20:00:00.000Z");
    expect(parsed.filters).toEqual({ range: "Last 30 days", qrId: "qr-1" });
    expect(parsed.data).toEqual([ROW]);
  });
});

describe("buildTextReport", () => {
  it("renders a structured plain-text report", () => {
    const report = buildTextReport(
      "QR Manager — Scans report",
      ["Period: Last 30 days", "Generated: now"],
      [
        { label: "Summary", items: [{ name: "Total scans", value: "12" }] },
        {
          label: "Browsers",
          items: [
            { name: "Safari", value: "8" },
            { name: "Chrome", value: "4" },
          ],
        },
      ]
    );
    expect(report.startsWith("QR Manager — Scans report\r\n")).toBe(true);
    expect(report).toContain("Period: Last 30 days");
    expect(report).toContain("======");
    expect(report).toContain("- Total scans: 12");
    expect(report).toContain("- Safari: 8");
    expect(report.endsWith("\r\n")).toBe(true);
    // Sections are separated by blank lines; only the final trailing run is trimmed.
    expect(report.replace(/\r\n+$/, "")).toMatch(/- Chrome: 4$/);
  });
});

describe("exportFilename", () => {
  const at = new Date("2026-08-15T20:00:00.000Z"); // UTC date = 20260815
  it("uses the UTC calendar date and the right extension", () => {
    expect(exportFilename("csv", at)).toBe("qr-manager-analytics-20260815.csv");
    expect(exportFilename("json", at)).toBe("qr-manager-analytics-20260815.json");
    expect(exportFilename("report", at)).toBe("qr-manager-analytics-20260815.txt");
  });
});