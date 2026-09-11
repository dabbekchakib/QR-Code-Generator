import { describe, it, expect } from "vitest";
import {
  filterAndSortRecords,
  duplicateRecord,
} from "../storage/utils";
import type { QRCodeRecord } from "../storage";
import type { QRType } from "@/types";

function makeRecord(overrides: Partial<QRCodeRecord> = {}): QRCodeRecord {
  return {
    id: "id-1",
    name: "Test QR",
    type: "website" as QRType,
    values: { url: "https://example.com" },
    customization: {
      size: 256,
      margin: 2,
      foreground: "#000000",
      background: "#FFFFFF",
      errorCorrection: "M",
      style: "square",
    },
    isDynamic: false,
    favorite: false,
    status: "active",
    shortCode: null,
    destinationUrl: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("filterAndSortRecords", () => {
  const records = [
    makeRecord({ id: "a", name: "Menu", updatedAt: "2026-01-03T00:00:00.000Z", createdAt: "2026-01-01T00:00:00.000Z" }),
    makeRecord({ id: "b", name: "Website", type: "website", favorite: true, updatedAt: "2026-01-02T00:00:00.000Z", createdAt: "2026-01-02T00:00:00.000Z" }),
    makeRecord({ id: "c", name: "WiFi Home", type: "wifi", updatedAt: "2026-01-01T00:00:00.000Z", createdAt: "2026-01-03T00:00:00.000Z" }),
    makeRecord({
      id: "d",
      name: "Menu dynamique",
      type: "website",
      isDynamic: true,
      shortCode: "Ab2cDe9F",
      destinationUrl: "https://menu.example",
      status: "disabled",
      updatedAt: "2026-01-04T00:00:00.000Z",
      createdAt: "2026-01-04T00:00:00.000Z",
    }),
  ];

  it("returns all records with status all", () => {
    const result = filterAndSortRecords(records, { status: "all", sort: "updated" });
    expect(result).toHaveLength(4);
  });

  it("filters by favorites", () => {
    const result = filterAndSortRecords(records, { status: "favorites", sort: "updated" });
    expect(result.map((r) => r.id)).toEqual(["b"]);
  });

  it("filters static records", () => {
    const result = filterAndSortRecords(records, { status: "static", sort: "updated" });
    expect(result.map((r) => r.id)).toEqual(["a", "b", "c"]);
    expect(result.every((r) => !r.isDynamic)).toBe(true);
  });

  it("filters dynamic records", () => {
    const result = filterAndSortRecords(records, { status: "dynamic", sort: "updated" });
    expect(result.map((r) => r.id)).toEqual(["d"]);
    expect(result[0].shortCode).toBe("Ab2cDe9F");
  });

  it("filters by type", () => {
    const result = filterAndSortRecords(records, {
      status: "all",
      type: "wifi",
      sort: "updated",
    });
    expect(result.map((r) => r.id)).toEqual(["c"]);
  });

  it("searches by name case-insensitively", () => {
    const result = filterAndSortRecords(records, {
      status: "all",
      search: "menu",
      sort: "updated",
    });
    expect(result.map((r) => r.id)).toEqual(["d", "a"]);
  });

  it("sorts by updated desc by default", () => {
    const result = filterAndSortRecords(records, { status: "all", sort: "updated" });
    expect(result.map((r) => r.id)).toEqual(["d", "a", "b", "c"]);
  });

  it("sorts by created desc", () => {
    const result = filterAndSortRecords(records, { status: "all", sort: "created" });
    expect(result.map((r) => r.id)).toEqual(["d", "c", "b", "a"]);
  });

  it("sorts by name asc and desc", () => {
    const asc = filterAndSortRecords(records, { status: "all", sort: "name-asc" });
    expect(asc.map((r) => r.id)).toEqual(["a", "d", "b", "c"]);
    const desc = filterAndSortRecords(records, { status: "all", sort: "name-desc" });
    expect(desc.map((r) => r.id)).toEqual(["c", "b", "d", "a"]);
  });
});

describe("duplicateRecord", () => {
  it("appends Copy to the name", () => {
    const copy = duplicateRecord(makeRecord({ name: "Restaurant Menu" }));
    expect(copy.name).toBe("Restaurant Menu Copy");
    expect(copy.id).not.toBe("id-1");
    expect(copy.favorite).toBe(false);
  });

  it("does not accumulate multiple Copy suffixes", () => {
    const first = duplicateRecord(makeRecord({ name: "Menu" }));
    const second = duplicateRecord(first);
    expect(second.name).toBe("Menu Copy");
  });

  it("resets dates", () => {
    const copy = duplicateRecord(makeRecord());
    expect(copy.createdAt).not.toBe("2026-01-01T00:00:00.000Z");
  });

  it("keeps a static record static", () => {
    const copy = duplicateRecord(makeRecord({ isDynamic: false }));
    expect(copy.isDynamic).toBe(false);
    expect(copy.shortCode).toBeNull();
  });

  it("regenerates the short code for a dynamic record", () => {
    const dynamic = makeRecord({
      isDynamic: true,
      shortCode: "Ab2cDe9F",
      destinationUrl: "https://menu.example",
      status: "active",
    });
    const copy = duplicateRecord(dynamic);
    expect(copy.isDynamic).toBe(true);
    expect(copy.destinationUrl).toBe("https://menu.example");
    expect(copy.status).toBe("active");
    expect(copy.shortCode).toBeTruthy();
    expect(copy.shortCode).not.toBe("Ab2cDe9F");
    expect(copy.shortCode).toHaveLength(8);
    expect(copy.favorite).toBe(false);
  });
});