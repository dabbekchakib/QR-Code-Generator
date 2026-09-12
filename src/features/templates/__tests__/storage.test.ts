import { describe, it, expect } from "vitest";
import { qrRecordSchema, recordFromBackup } from "@/features/qr/storage/backup";
import {
  cloudRowToLocalRecord,
  localRecordToCloudRow,
} from "@/features/qr/cloud/mappers";
import { validateCloudRow } from "@/features/qr/cloud/schemas";
import { createRecord, normalizeRecord } from "@/features/qr/storage/db";

const NOW = "2026-01-01T00:00:00.000Z";

function makeCloudRow(templateId: string | null, overrides: Record<string, unknown> = {}) {
  return {
    id: "qr-1",
    user_id: "user-1",
    name: "Menu",
    type: "website",
    values: { url: "https://menu.example" },
    customization: {
      size: 256,
      margin: 2,
      foreground: "#000000",
      background: "#FFFFFF",
      errorCorrection: "M",
      style: "square",
    },
    favorite: false,
    is_dynamic: true,
    short_code: "Ab2cDe9F",
    destination_url: "https://menu.example",
    status: "active",
    template_id: templateId,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

function makeRecord(templateId: string | null = "restaurant-menu") {
  return createRecord({
    name: "Menu",
    type: "website",
    values: { url: "https://menu.example" },
    customization: {
      size: 256,
      margin: 2,
      foreground: "#000000",
      background: "#FFFFFF",
      errorCorrection: "M",
      style: "square",
    },
    isDynamic: true,
    shortCode: "Ab2cDe9F",
    destinationUrl: "https://menu.example",
    status: "active",
    templateId,
  });
}

describe("templateId survives the storage round trip", () => {
  it("createRecord + normalizeRecord keep it (and default it to null when absent)", () => {
    const plain = createRecord({
      name: "Plain",
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
    });
    expect(normalizeRecord(plain).templateId).toBeNull();
    expect(normalizeRecord(makeRecord("restaurant-menu")).templateId).toBe("restaurant-menu");
  });

  it("backup schema writes and reads templateId (nullable for old files)", () => {
    const withTemplate = { ...makeRecord(), id: "qr-menu" };
    asQRInput(withTemplate);
    expect(qrRecordSchema.safeParse(withTemplate).success).toBe(true);

    const legacy = { ...makeRecord(), id: "qr-menu", createdAt: NOW, updatedAt: NOW };
    delete (legacy as Record<string, unknown>).templateId;
    const parsed = qrRecordSchema.parse(legacy) as unknown as {
      templateId?: unknown;
      type: string;
      values: unknown;
      customization: unknown;
      isDynamic: boolean;
      favorite: boolean;
      createdAt: string;
      updatedAt: string;
    };
    expect(parsed.templateId).toBeUndefined();
    const restored = recordFromBackup({
      id: "qr-menu",
      name: "Menu",
      type: parsed.type,
      values: parsed.values,
      customization: parsed.customization,
      isDynamic: parsed.isDynamic,
      favorite: parsed.favorite,
      createdAt: parsed.createdAt,
      updatedAt: parsed.updatedAt,
    } as never);
    expect(restored.templateId).toBeNull();
  });

  it("vcard records with an empty lastName stay valid for backup", () => {
    const contact = {
      id: "qr-contact",
      name: "Reception",
      type: "vcard" as const,
      values: {
        firstName: "Reception",
        lastName: "",
        organization: "",
        jobTitle: "",
        phone: "+33612345678",
        email: "",
        website: "",
        address: "",
        city: "",
        country: "",
        note: "",
      },
      customization: {
        size: 256,
        margin: 2,
        foreground: "#000000",
        background: "#FFFFFF",
        errorCorrection: "M" as const,
        style: "square" as const,
      },
      isDynamic: false,
      favorite: false,
      status: "active" as const,
      createdAt: NOW,
      updatedAt: NOW,
    };
    expect(qrRecordSchema.safeParse(contact).success).toBe(true);
  });

  it("cloud row round trip preserves template_id", () => {
    const local = cloudRowToLocalRecord(makeCloudRow("restaurant-menu") as never);
    expect(local.templateId).toBe("restaurant-menu");

    const row = localRecordToCloudRow(local, "user-1");
    expect(row.template_id).toBe("restaurant-menu");
    expect(cloudRowToLocalRecord(row).templateId).toBe("restaurant-menu");
  });

  it("legacy cloud rows without template_id normalize to null", () => {
    const legacy = makeCloudRow(null);
    delete (legacy as Record<string, unknown>).template_id;
    const local = cloudRowToLocalRecord(validateCloudRow(legacy) as never);
    expect(local.templateId).toBeNull();
  });
});

/** Anchor a freshly created record's timestamps so backup schema round trips are deterministic. */
function asQRInput(record: ReturnType<typeof makeRecord>): void {
  record.createdAt = NOW;
  record.updatedAt = NOW;
}