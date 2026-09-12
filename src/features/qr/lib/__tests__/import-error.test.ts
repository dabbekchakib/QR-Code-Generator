import { describe, it, expect } from "vitest";
import { importErrorKey } from "../import-error";

describe("importErrorKey", () => {
  it("maps known backup errors to i18n keys", () => {
    expect(importErrorKey(new Error("Empty backup file"))).toBe(
      "library.importEmpty"
    );
    expect(importErrorKey(new Error("Backup file too large"))).toBe(
      "library.importTooLarge"
    );
    expect(importErrorKey(new Error("Invalid JSON file"))).toBe(
      "library.importInvalidJson"
    );
    expect(importErrorKey(new Error("Invalid backup structure"))).toBe(
      "library.importInvalidStructure"
    );
  });

  it("falls back to a generic key for anything else", () => {
    expect(importErrorKey(new Error("something unexpected"))).toBe(
      "library.importInvalidFile"
    );
    expect(importErrorKey("not-an-error")).toBe("library.importInvalidFile");
    expect(importErrorKey(null)).toBe("library.importInvalidFile");
  });

  it("keeps matching every error thrown by parseBackupJson", async () => {
    const { parseBackupJson } = await import("../../storage/backup");
    const cases: unknown[] = [
      "",
      "   ",
      "not json at all",
      '{"qrCodes":{"not":"an array"}}',
      '{"qrCodes":[{}, {"type":"unknown"}]}',
    ];
    for (const input of cases) {
      let thrown: unknown;
      try {
        parseBackupJson(input as string);
      } catch (err) {
        thrown = err;
      }
      // Every production error must resolve to a translated key — never a raw
      // English message leaking into the UI.
      const key = importErrorKey(thrown);
      expect(key).toMatch(/^library\.import/);
      expect(thrown).toBeInstanceOf(Error);
    }
  });
});