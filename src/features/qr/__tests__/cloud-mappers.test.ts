import { describe, it, expect } from "vitest";
import {
  cloudRowToLocalRecord,
  localRecordToCloudRow,
} from "../cloud/mappers";
import { validateCloudRow, cloudQRRowSchema } from "../cloud/schemas";

function makeCloudRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "qr-1",
    user_id: "user-1",
    name: "My Website",
    type: "website",
    values: { url: "https://example.com" },
    customization: {
      size: 256,
      margin: 2,
      foreground: "#000000",
      background: "#FFFFFF",
      errorCorrection: "M",
      style: "square",
    },
    favorite: true,
    is_dynamic: false,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

describe("cloudQRRowSchema", () => {
  it("accepts a valid website row", () => {
    expect(cloudQRRowSchema.safeParse(makeCloudRow()).success).toBe(true);
  });

  it("rejects a row with an unknown type", () => {
    expect(cloudQRRowSchema.safeParse(makeCloudRow({ type: "evil" })).success).toBe(false);
  });

  it("rejects invalid values for the type", () => {
    expect(
      cloudQRRowSchema.safeParse(makeCloudRow({ values: { url: "nope" } })).success
    ).toBe(false);
  });

  it("rejects a row without user_id", () => {
    const { user_id: _ignored, ...rest } = makeCloudRow();
    expect(cloudQRRowSchema.safeParse(rest).success).toBe(false);
  });
});

describe("validateCloudRow", () => {
  it("returns the parsed row when valid", () => {
    expect(validateCloudRow(makeCloudRow()).id).toBe("qr-1");
  });

  it("throws on invalid data", () => {
    expect(() => validateCloudRow({ garbage: true })).toThrow(/Invalid cloud QR/);
  });
});

describe("mapCloudRow <-> local record", () => {
  it("maps snake_case cloud row to camelCase local record", () => {
    const local = cloudRowToLocalRecord(makeCloudRow() as never);
    expect(local.id).toBe("qr-1");
    expect(local.isDynamic).toBe(false);
    expect(local.updatedAt).toBe("2026-01-02T00:00:00.000Z");
    expect(local.values).toEqual({ url: "https://example.com" });
  });

  it("maps local record back to a cloud row with the user id", () => {
    const local = cloudRowToLocalRecord(makeCloudRow() as never);
    const row = localRecordToCloudRow(local, "user-42");
    expect(row.user_id).toBe("user-42");
    expect(row.is_dynamic).toBe(false);
    expect(row.id).toBe("qr-1");
  });

  it("round-trips a record through both mappers", () => {
    const original = cloudRowToLocalRecord(makeCloudRow() as never);
    const row = localRecordToCloudRow(original, "user-1");
    const back = cloudRowToLocalRecord(row);
    expect(back).toEqual(original);
  });
});