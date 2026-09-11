import { describe, it, expect } from "vitest";
import {
  buildBackupFile,
  parseBackupJson,
  qrRecordSchema,
  backupFileSchema,
} from "../storage/backup";

function makeWebsiteRecord() {
  return {
    id: "qr-1",
    name: "My Website",
    type: "website" as const,
    values: { url: "https://example.com" },
    customization: {
      size: 256,
      margin: 2,
      foreground: "#000000",
      background: "#FFFFFF",
      errorCorrection: "M" as const,
      style: "square" as const,
    },
    isDynamic: false,
    favorite: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("qrRecordSchema", () => {
  it("accepts a valid website record", () => {
    const result = qrRecordSchema.safeParse(makeWebsiteRecord());
    expect(result.success).toBe(true);
  });

  it("rejects an unknown type", () => {
    const record = { ...makeWebsiteRecord(), type: "unknown" };
    expect(qrRecordSchema.safeParse(record).success).toBe(false);
  });

  it("accepts a dynamic record with short code and destination", () => {
    const record = {
      ...makeWebsiteRecord(),
      isDynamic: true,
      shortCode: "Ab2cDe9F",
      destinationUrl: "https://menu.example",
      status: "active" as const,
    };
    expect(qrRecordSchema.safeParse(record).success).toBe(true);
  });

  it("rejects a dynamic record without its short code / destination", () => {
    const record = { ...makeWebsiteRecord(), isDynamic: true };
    expect(qrRecordSchema.safeParse(record).success).toBe(false);
  });

  it("rejects invalid values for the type", () => {
    const record = { ...makeWebsiteRecord(), values: { url: "not-a-url" } };
    expect(qrRecordSchema.safeParse(record).success).toBe(false);
  });

  it("accepts a wifi record", () => {
    const record = {
      ...makeWebsiteRecord(),
      id: "qr-2",
      type: "wifi" as const,
      values: { ssid: "Cafe", password: "secret", security: "WPA" as const, hidden: false },
    };
    expect(qrRecordSchema.safeParse(record).success).toBe(true);
  });
});

describe("buildBackupFile / parseBackupJson", () => {
  it("builds a valid backup file", () => {
    const backup = buildBackupFile([makeWebsiteRecord() as never]);
    expect(backup.app).toBe("qr-manager");
    expect(backup.version).toBe(1);
    expect(backup.qrCodes).toHaveLength(1);
    expect(backupFileSchema.safeParse(backup).success).toBe(true);
  });

  it("round-trips JSON serialization", () => {
    const backup = buildBackupFile([makeWebsiteRecord() as never]);
    const parsed = parseBackupJson(JSON.stringify(backup));
    expect(parsed.qrCodes[0].name).toBe("My Website");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseBackupJson("not json")).toThrow("Invalid JSON");
  });

  it("throws on wrong structure", () => {
    expect(() =>
      parseBackupJson(JSON.stringify({ app: "other-app", version: 1, qrCodes: [] }))
    ).toThrow("Invalid backup");
  });

  it("throws when qrCodes contains an invalid record", () => {
    const bad = JSON.stringify({
      app: "qr-manager",
      version: 1,
      qrCodes: [{ ...makeWebsiteRecord(), name: "" }],
    });
    expect(() => parseBackupJson(bad)).toThrow("Invalid backup");
  });
});