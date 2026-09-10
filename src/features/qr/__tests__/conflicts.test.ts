import { describe, it, expect } from "vitest";
import { resolveConflict, reconcileRecords, isCloudNewer } from "../sync/conflicts";
import type { QRCodeRecord } from "../storage/types";

function makeRecord(overrides: Partial<QRCodeRecord> = {}): QRCodeRecord {
  return {
    id: "qr-1",
    name: "Rec",
    type: "website",
    values: { url: "https://a.example" },
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
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  } as QRCodeRecord;
}

describe("isCloudNewer", () => {
  it("compares ISO timestamps", () => {
    expect(isCloudNewer("2026-01-01T00:00:00.000Z", "2026-01-02T00:00:00.000Z")).toBe(true);
    expect(isCloudNewer("2026-01-02T00:00:00.000Z", "2026-01-01T00:00:00.000Z")).toBe(false);
  });
});

describe("resolveConflict (newest updatedAt wins)", () => {
  it("returns the cloud version when it is newer", () => {
    const local = makeRecord({ name: "old", updatedAt: "2026-01-01T00:00:00.000Z" });
    const cloud = makeRecord({ name: "new", updatedAt: "2026-01-03T00:00:00.000Z" });
    expect(resolveConflict(local, cloud).name).toBe("new");
  });

  it("keeps the local version when it is newer", () => {
    const local = makeRecord({ name: "local-new", updatedAt: "2026-01-05T00:00:00.000Z" });
    const cloud = makeRecord({ name: "cloud-old", updatedAt: "2026-01-01T00:00:00.000Z" });
    expect(resolveConflict(local, cloud).name).toBe("local-new");
  });

  it("keeps the local version on equal timestamps", () => {
    const local = makeRecord({ name: "same" });
    const cloud = makeRecord({ name: "same-but" });
    expect(resolveConflict(local, cloud).name).toBe("same");
  });
});

describe("reconcileRecords", () => {
  it("adds cloud-only records", () => {
    const local = [makeRecord({ id: "a" })];
    const cloud = [
      makeRecord({ id: "b", name: "cloud-only", updatedAt: "2026-01-02T00:00:00.000Z" }),
    ];
    const merged = reconcileRecords(local, cloud);
    expect(merged.map((r) => r.id).sort()).toEqual(["a", "b"]);
  });

  it("keeps local-only records (offline pending)", () => {
    const local = [makeRecord({ id: "local-only", updatedAt: "2026-01-01T00:00:00.000Z" })];
    const merged = reconcileRecords(local, []);
    expect(merged.map((r) => r.id)).toEqual(["local-only"]);
  });

  it("prefers the newest version for shared records", () => {
    const local = [makeRecord({ id: "x", name: "local", updatedAt: "2026-01-01T00:00:00.000Z" })];
    const cloud = [makeRecord({ id: "x", name: "cloud", updatedAt: "2026-01-04T00:00:00.000Z" })];
    const merged = reconcileRecords(local, cloud);
    expect(merged[0].name).toBe("cloud");
  });

  it("sorts the result by updatedAt desc", () => {
    const local = [makeRecord({ id: "old", updatedAt: "2026-01-01T00:00:00.000Z" })];
    const cloud = [
      makeRecord({ id: "mid", updatedAt: "2026-01-03T00:00:00.000Z" }),
      makeRecord({ id: "top", updatedAt: "2026-01-05T00:00:00.000Z" }),
    ];
    const merged = reconcileRecords(local, cloud);
    expect(merged.map((r) => r.id)).toEqual(["top", "mid", "old"]);
  });
});