import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { getDB, resetDBForTests } from "../storage/db";
import { qrService } from "../service/qr-service";
import { useSyncStore } from "../sync/sync-store";
import { pendingCount } from "../sync/queue-store";
import type { QRCodeRecord } from "../storage/types";

const USER = "user-1";

type Row = Record<string, unknown>;

function sortRows(rows: Row[], col: string, dir: "asc" | "desc") {
  const f = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) =>
    String(a[col]).localeCompare(String(b[col])) * f
  );
}

/**
 * A tiny in-memory fake of the PostgREST API surface the app uses. It only
 * supports the qr_codes table and the query shapes used by the app.
 */
class FakeQuery {
  private table: string;
  private mode: "select" | "insert" | "update" | "delete" | "upsert";
  private filters: Record<string, unknown> = {};
  private payload: Row | null = null;
  private orderCol: string | null = null;
  private orderDir: "asc" | "desc" = "asc";

  constructor(
    private rows: Row[],
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

  private match(filters: Record<string, unknown>) {
    return this.rows.filter((r) =>
      Object.entries(filters).every(([k, v]) => r[k] === v)
    );
  }

  private resolve(): { data: Row[] | null; error: null } {
    if (this.table !== "qr_codes") return { data: null, error: null };
    let result =
      Object.keys(this.filters).length > 0
        ? this.match(this.filters)
        : this.rows;

    if (this.mode === "insert" && this.payload) {
      result = [this.payload];
      this.rows.push(this.payload);
    } else if (this.mode === "upsert" && this.payload) {
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
    const { data } = this.resolve();
    return { data: data?.[0] ?? null, error: null };
  }
  async single() {
    const { data } = this.resolve();
    if (!data || data.length === 0) {
      return { data: null, error: new Error("PGRST116: 0 rows") };
    }
    return { data: data[0], error: null };
  }
  then<TResolve = unknown>(
    resolve: (v: { data: Row[] | null; error: null }) => TResolve
  ): Promise<TResolve> {
    return Promise.resolve(this.resolve()).then(resolve);
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

function makeLocalRecord(overrides: Partial<QRCodeRecord> = {}): QRCodeRecord {
  return {
    id: "local-1",
    name: "Local",
    type: "website",
    values: { url: "https://local.example" },
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

describe("qrService — anonymous (local only)", () => {
  it("creates and lists records locally", async () => {
    const created = await qrService.create(
      makeLocalRecord({ id: "x" })
    );
    expect(created.id).toBe("x");
    const records = await qrService.list();
    expect(records.map((r) => r.id)).toEqual(["x"]);
  });

  it("does not enqueue anything when anonymous", async () => {
    await qrService.create(makeLocalRecord({ id: "anon" }));
    expect(await pendingCount()).toBe(0);
  });
});

describe("qrService — authenticated, online", () => {
  it("pushes created records to the cloud", async () => {
    const client = createFakeClient();
    qrService.bindAuth(client as never, USER);

    await qrService.create(makeLocalRecord({ id: "pushme" }));

    // Cloud row was created (favorite should be false).
    expect(client.rows).toHaveLength(1);
    expect(client.rows[0].user_id).toBe(USER);
    expect(client.rows[0].id).toBe("pushme");
    expect(await pendingCount()).toBe(0);
  });

  it("updates the cloud row on favoriting", async () => {
    const client = createFakeClient();
    qrService.bindAuth(client as never, USER);

    const created = await qrService.create(makeLocalRecord({ id: "fav" }));
    await qrService.update({ ...created, favorite: true });

    expect(client.rows[0].favorite).toBe(true);
  });

  it("deletes the cloud row on delete", async () => {
    const client = createFakeClient();
    qrService.bindAuth(client as never, USER);

    await qrService.create(makeLocalRecord({ id: "del" }));
    await qrService.deleteRecord("del");

    expect(client.rows).toHaveLength(0);
    expect(await pendingCount()).toBe(0);
  });

  it("pulls cloud-only records into the local cache on refresh", async () => {
    const client = createFakeClient();
    client.rows.push({
      id: "from-cloud",
      user_id: USER,
      name: "Cloud only",
      type: "website",
      values: { url: "https://cloud.example" },
      customization: {
        size: 256,
        margin: 2,
        foreground: "#000000",
        background: "#FFFFFF",
        errorCorrection: "M",
        style: "square",
      },
      favorite: false,
      is_dynamic: false,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
    });
    qrService.bindAuth(client as never, USER);

    const merged = await qrService.refresh();
    expect(merged.map((r) => r.id)).toEqual(["from-cloud"]);

    const local = await qrService.list();
    expect(local.map((r) => r.id)).toEqual(["from-cloud"]);
  });
});

describe("qrService — authenticated, offline", () => {
  it("queues mutations while offline and replays them when back online", async () => {
    const client = createFakeClient();
    qrService.bindAuth(client as never, USER);
    useSyncStore.getState().setOnline(false);

    await qrService.create(makeLocalRecord({ id: "off1" }));
    expect(client.rows).toHaveLength(0);
    expect(await pendingCount()).toBe(1);

    useSyncStore.getState().setOnline(true);
    await qrService.syncNow();

    expect(client.rows).toHaveLength(1);
    expect(client.rows[0].id).toBe("off1");
    expect(await pendingCount()).toBe(0);
  });

  it("coalesces an offline favorite toggle into one cloud update", async () => {
    const client = createFakeClient();
    qrService.bindAuth(client as never, USER);
    useSyncStore.getState().setOnline(false);

    const created = await qrService.create(makeLocalRecord({ id: "t1" }));
    await qrService.update({ ...created, favorite: true });
    await qrService.update({ ...created, favorite: false });
    expect(await pendingCount()).toBe(1);

    useSyncStore.getState().setOnline(true);
    await qrService.syncNow();

    expect(client.rows).toHaveLength(1);
    expect(client.rows[0].favorite).toBe(false);
  });
});

describe("qrService — logout keeps local data", () => {
  it("clears auth binding but not the local IndexedDB cache", async () => {
    const db = await getDB();
    await db.put("qr-codes", makeLocalRecord({ id: "keepme" }));

    const client = createFakeClient();
    qrService.bindAuth(client as never, USER);
    qrService.clearAuth();

    const records = await qrService.list();
    expect(records.map((r) => r.id)).toEqual(["keepme"]);
    expect(await pendingCount()).toBe(0);
  });
});