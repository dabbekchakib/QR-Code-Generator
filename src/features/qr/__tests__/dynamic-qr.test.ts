import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getDB, resetDBForTests } from "../storage/db";
import { qrService } from "../service/qr-service";
import { useSyncStore } from "../sync/sync-store";
import { pendingCount } from "../sync/queue-store";
import {
  generateShortCode,
  isShortCodeFormat,
  SHORT_CODE_LENGTH,
  MAX_SHORT_CODE_ATTEMPTS,
  validateDynamicDestination,
  isSafeDestination,
  DynamicQRError,
  getDynamicQRUrl,
  getDynamicQRUrlWithFallback,
  getAppBaseUrl,
} from "../dynamic";

type Row = Record<string, unknown>;

function sortRows(rows: Row[], col: string, dir: "asc" | "desc") {
  const f = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) =>
    String(a[col]).localeCompare(String(b[col])) * f
  );
}

/**
 * Minimal PostgREST fake with an optional unique-constraint simulation on
 * short_code so the collision retry path can be exercised in a unit test.
 */
class FakeQuery {
  private table: string;
  private mode: "select" | "insert" | "update" | "delete" | "upsert";
  private filters: Record<string, unknown> = {};
  private payload: Row | null = null;
  private orderCol: string | null = null;
  private orderDir: "asc" | "desc" = "asc";

  constructor(
    protected rows: Row[],
    table: string,
    mode = "select" as const
  ) {
    this.table = table;
    this.mode = mode;
  }

  select() {
    return this;
  }
  eq(k: string, v: unknown) {
    this.filters[k] = v;
    return this;
  }
  order(col: string, opts: { ascending: boolean }) {
    this.orderCol = col;
    this.orderDir = opts.ascending ? "asc" : "desc";
    return this;
  }
  insert(payload: Row) {
    this.mode = "insert";
    this.payload = payload;
    return this;
  }
  update(payload: Row) {
    this.mode = "update";
    this.payload = payload;
    return this;
  }
  delete() {
    this.mode = "delete";
    return this;
  }
  upsert(payload: Row, _opts: { onConflict?: string } = {}) {
    this.mode = "upsert";
    this.payload = payload;
    return this;
  }

  /** Subclasses can veto an insert/upsert (unique violation simulation). */
  protected onWrite(_payload: Row): string | null {
    return null;
  }

  private match(filters: Record<string, unknown>) {
    return this.rows.filter((r) =>
      Object.entries(filters).every(([k, v]) => r[k] === v)
    );
  }

  private resolve(): { data: Row[] | null; error: null | { message: string } } {
    if (this.table !== "qr_codes") return { data: null, error: null };
    let result =
      Object.keys(this.filters).length > 0
        ? this.match(this.filters)
        : this.rows;

    if (this.mode === "insert" && this.payload) {
      const violation = this.onWrite(this.payload);
      if (violation) return { data: null, error: { message: violation } };
      result = [this.payload];
      this.rows.push(this.payload);
    } else if (this.mode === "upsert" && this.payload) {
      const violation = this.onWrite(this.payload);
      if (violation) return { data: null, error: { message: violation } };
      const id = this.payload.id;
      const idx = this.rows.findIndex((r) => r.id === id);
      if (idx >= 0) this.rows[idx] = { ...this.rows[idx], ...this.payload };
      else this.rows.push(this.payload);
      result = [this.rows.find((r) => r.id === id)!];
    } else if (this.mode === "update" && this.payload) {
      for (const t of result) Object.assign(t, this.payload);
    } else if (this.mode === "delete") {
      for (const t of result) {
        const idx = this.rows.indexOf(t);
        if (idx >= 0) this.rows.splice(idx, 1);
      }
    }

    if (this.orderCol) {
      result = sortRows(result, this.orderCol, this.orderDir);
    }
    return { data: result, error: null };
  }

  async maybeSingle() {
    const { data, error } = this.resolve();
    return { data: data?.[0] ?? null, error };
  }
  async single() {
    const { data, error } = this.resolve();
    if (error) return { data: null, error };
    if (!data || data.length === 0) {
      return { data: null, error: new Error("PGRST116: 0 rows") };
    }
    return { data: data[0], error: null };
  }
  then<TResolve = unknown>(
    resolve: (v: { data: Row[] | null; error: null }) => TResolve
  ): Promise<TResolve> {
    return Promise.resolve(this.resolve()).then((v) => resolve(v as never));
  }
}

/** Vetoes creation of a second row with the same short_code (like Postgres). */
class UniqueShortCodeQuery extends FakeQuery {
  protected onWrite(payload: Row): string | null {
    const code = payload.short_code as string | null;
    if (code && this.rows.some((r) => r.short_code === code)) {
      return 'duplicate key value violates unique constraint "qr_codes_short_code_unique"';
    }
    return null;
  }
}

function createFakeClient(): { from: (t: string) => FakeQuery; rows: Row[] } {
  const rows: Row[] = [];
  const client = {
    rows,
    from(table: string) {
      return new FakeQuery(rows, table);
    },
  };
  return client;
}

function createUniqueClient(): { from: (t: string) => FakeQuery; rows: Row[] } {
  const rows: Row[] = [];
  const client = {
    rows,
    from(table: string) {
      return new UniqueShortCodeQuery(rows, table);
    },
  };
  return client;
}

const USER = "user-1";
const DESTINATION = "https://menu.example.com/v2";

beforeEach(async () => {
  resetDBForTests();
  const db = await getDB();
  await db.clear("qr-codes");
  await db.clear("sync-queue");
  qrService.clearAuth();
  useSyncStore.getState().setOnline(true);
  useSyncStore.getState().setStatus("idle");
  useSyncStore.getState().setPendingCount(0);
});

describe("generateShortCode", () => {
  it("produces URL-safe codes of the expected length", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateShortCode();
      expect(code).toHaveLength(SHORT_CODE_LENGTH);
      expect(isShortCodeFormat(code)).toBe(true);
      expect(/[0O1lI]/.test(code)).toBe(false);
    }
  });

  it("is effectively unique across many draws", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 5000; i++) seen.add(generateShortCode());
    expect(seen.size).toBe(5000);
  });

  it("rejects non-conforming strings in isShortCodeFormat", () => {
    expect(isShortCodeFormat("tooshort")).toBe(false);
    expect(isShortCodeFormat("has-ambiguous-0")).toBe(false);
    expect(isShortCodeFormat(generateShortCode() + "x")).toBe(false);
  });
});

describe("validateDynamicDestination", () => {
  it("accepts http/https URLs and trims whitespace", () => {
    expect(validateDynamicDestination("  https://example.com/abc  ")).toBe(
      "https://example.com/abc"
    );
    expect(validateDynamicDestination("http://localhost:3000/x")).toBe(
      "http://localhost:3000/x"
    );
  });

  it.each([
    "",
    "   ",
    "example.com",
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "ftp://files.example.com/f",
    "file:///etc/passwd",
    "//example.com",
  ])("rejects unsafe input %s", (value) => {
    expect(isSafeDestination(value)).toBe(false);
    expect(() => validateDynamicDestination(value)).toThrowError(
      DynamicQRError
    );
  });

  it("throws a controlled error code, never a raw Zod error", () => {
    try {
      validateDynamicDestination("nope");
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(DynamicQRError);
      expect((err as DynamicQRError).code).toBe("INVALID_DESTINATION");
    }
  });
});

describe("getDynamicQRUrl", () => {
  const original = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = original;
  });

  it("builds the permanent URL from NEXT_PUBLIC_APP_URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://qr.example.com";
    expect(getDynamicQRUrl("Ab2cDe9F")).toBe("https://qr.example.com/Ab2cDe9F");
  });

  it("normalizes a trailing slash on the base URL", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://qr.example.com/";
    expect(getAppBaseUrl()).toBe("https://qr.example.com");
    expect(getDynamicQRUrl("xY7z")).toBe("https://qr.example.com/xY7z");
  });

  it("throws when NEXT_PUBLIC_APP_URL is missing", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(() => getDynamicQRUrl("xY7z")).toThrowError(DynamicQRError);
    expect(() => getDynamicQRUrl("xY7z")).toThrow(/NEXT_PUBLIC_APP_URL/);
  });

  it("falls back to a relative route for previews", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(getDynamicQRUrlWithFallback("xY7z")).toBe("/qr/xY7z");
  });
});

describe("createDynamic — anonymous (local only)", () => {
  it("stores a dynamic record locally with a generated code", async () => {
    const created = await qrService.createDynamic({
      name: "Menu dynamic",
      destinationUrl: DESTINATION,
      customization: {
        size: 256,
        margin: 2,
        foreground: "#000000",
        background: "#FFFFFF",
        errorCorrection: "M",
        style: "square",
      },
    });

    expect(created.isDynamic).toBe(true);
    expect(created.destinationUrl).toBe(DESTINATION);
    expect(created.status).toBe("active");
    expect(created.shortCode).toBeTruthy();
    expect(created.shortCode).toHaveLength(SHORT_CODE_LENGTH);
    expect(isShortCodeFormat(created.shortCode!)).toBe(true);
    expect(created.values).toEqual({ url: DESTINATION });
    expect(await pendingCount()).toBe(0);

    const fromList = await qrService.list();
    expect(fromList.find((r) => r.id === created.id)?.shortCode).toBe(
      created.shortCode
    );
  });

  it("rejects an invalid destination before writing anything", async () => {
    await expect(
      qrService.createDynamic({
        name: "Bad",
        destinationUrl: "not-a-url",
        customization: {
          size: 256,
          margin: 2,
          foreground: "#000000",
          background: "#FFFFFF",
          errorCorrection: "M",
          style: "square",
        },
      })
    ).rejects.toMatchObject({ code: "INVALID_DESTINATION" });
    expect(await qrService.list()).toHaveLength(0);
  });
});

describe("createDynamic — authenticated, online", () => {
  it("pushes the dynamic fields to the cloud", async () => {
    const client = createFakeClient();
    qrService.bindAuth(client as never, USER);

    const created = await qrService.createDynamic({
      name: "Site",
      destinationUrl: DESTINATION,
      customization: {
        size: 256,
        margin: 2,
        foreground: "#000000",
        background: "#FFFFFF",
        errorCorrection: "M",
        style: "square",
      },
      preferredShortCode: "Ab2cDe9F",
    });

    expect(created.shortCode).toBe("Ab2cDe9F");
    expect(client.rows).toHaveLength(1);
    expect(client.rows[0]).toMatchObject({
      user_id: USER,
      is_dynamic: true,
      short_code: "Ab2cDe9F",
      destination_url: DESTINATION,
      status: "active",
    });
    expect(await pendingCount()).toBe(0);
  });

  it("retries with a fresh code on a short-code collision", async () => {
    const client = createUniqueClient();
    client.rows.push({
      id: "other",
      user_id: USER,
      name: "Taken",
      type: "website",
      values: { url: "https://other.example" },
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
      short_code: "Taken0001",
      destination_url: "https://other.example",
      status: "active",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    });
    qrService.bindAuth(client as never, USER);

    const created = await qrService.createDynamic({
      name: "Fresh",
      destinationUrl: DESTINATION,
      customization: {
        size: 256,
        margin: 2,
        foreground: "#000000",
        background: "#FFFFFF",
        errorCorrection: "M",
        style: "square",
      },
      preferredShortCode: "Taken0001",
    });

    expect(created.shortCode).not.toBe("Taken0001");
    expect(isShortCodeFormat(created.shortCode!)).toBe(true);
    // The retry rolled back its first local attempt and pushed once more with
    // a fresh code, so the cloud still holds exactly one "Taken0001" (the seed).
    expect(client.rows).toHaveLength(2);
    expect(client.rows.filter((r) => r.short_code === "Taken0001")).toHaveLength(1);
    expect(await pendingCount()).toBe(0);
  });

  it("exhausts retries and surfaces SHORT_CODE_GENERATION_FAILED", async () => {
    // Force every insertion to collide by seeding the table with each alphabet
    // code is impractical; instead simulate the DB always throwing 23505 via a
    // subclass that rejects inserts whenever the preferred code is involved.
    const rows: Row[] = [];
    const query = new (class extends FakeQuery {
      protected onWrite(): string | null {
        return 'duplicate key value violates unique constraint "qr_codes_short_code_unique"';
      }
    })(rows, "qr_codes");
    const client = {
      rows,
      from: (t: string) => (t === "qr_codes" ? query : new FakeQuery(rows, t)),
    };
    qrService.bindAuth(client as never, USER);

    await expect(
      qrService.createDynamic({
        name: "Doomed",
        destinationUrl: DESTINATION,
        customization: {
          size: 256,
          margin: 2,
          foreground: "#000000",
          background: "#FFFFFF",
          errorCorrection: "M",
          style: "square",
        },
      })
    ).rejects.toMatchObject({ code: "SHORT_CODE_GENERATION_FAILED" });

    expect(rows).toHaveLength(0);
    expect(await qrService.list()).toHaveLength(0);
    expect(MAX_SHORT_CODE_ATTEMPTS).toBeGreaterThanOrEqual(3);
  });
});

describe("createDynamic — authenticated, offline", () => {
  it("queues the CREATE and replays the dynamic fields later", async () => {
    const client = createFakeClient();
    qrService.bindAuth(client as never, USER);
    useSyncStore.getState().setOnline(false);

    const created = await qrService.createDynamic({
      name: "Hors ligne",
      destinationUrl: DESTINATION,
      customization: {
        size: 256,
        margin: 2,
        foreground: "#000000",
        background: "#FFFFFF",
        errorCorrection: "M",
        style: "square",
      },
    });

    expect(client.rows).toHaveLength(0);
    expect(await pendingCount()).toBe(1);
    expect(created.shortCode).toBeTruthy();

    useSyncStore.getState().setOnline(true);
    await qrService.syncNow();

    expect(client.rows).toHaveLength(1);
    expect(client.rows[0]).toMatchObject({
      is_dynamic: true,
      short_code: created.shortCode,
      destination_url: DESTINATION,
      status: "active",
    });
    expect(await pendingCount()).toBe(0);
  });
});

describe("updateDynamicDestination / setDynamicStatus", () => {
  it("keeps the short code when the destination changes", async () => {
    const created = await qrService.createDynamic({
      name: "Editable",
      destinationUrl: DESTINATION,
      customization: {
        size: 256,
        margin: 2,
        foreground: "#000000",
        background: "#FFFFFF",
        errorCorrection: "M",
        style: "square",
      },
    });
    const shortCode = created.shortCode!;
    const before = created.updatedAt;

    const updated = await qrService.updateDynamicDestination(
      created,
      "https://new.example.org/page"
    );

    expect(updated.shortCode).toBe(shortCode);
    expect(updated.destinationUrl).toBe("https://new.example.org/page");
    expect(updated.values).toEqual({ url: "https://new.example.org/page" });
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(before).getTime()
    );
  });

  it("rejects editing a destination on a static record", async () => {
    const staticRecord = await qrService.create({
      name: "Static",
      type: "website",
      values: { url: "https://static.example" },
      customization: {
        size: 256,
        margin: 2,
        foreground: "#000000",
        background: "#FFFFFF",
        errorCorrection: "M",
        style: "square",
      },
      isDynamic: false,
    });
    staticRecord.isDynamic = false;

    await expect(
      qrService.updateDynamicDestination(staticRecord, "https://x.example")
    ).rejects.toMatchObject({ code: "INVALID_DESTINATION" });
  });

  it("toggles the status without touching the short code", async () => {
    const created = await qrService.createDynamic({
      name: "Toggle",
      destinationUrl: DESTINATION,
      customization: {
        size: 256,
        margin: 2,
        foreground: "#000000",
        background: "#FFFFFF",
        errorCorrection: "M",
        style: "square",
      },
    });

    const disabled = await qrService.setDynamicStatus(created, "disabled");
    expect(disabled.status).toBe("disabled");
    expect(disabled.shortCode).toBe(created.shortCode);

    const reEnabled = await qrService.setDynamicStatus(disabled, "active");
    expect(reEnabled.status).toBe("active");
    expect(reEnabled.shortCode).toBe(created.shortCode);
  });
});