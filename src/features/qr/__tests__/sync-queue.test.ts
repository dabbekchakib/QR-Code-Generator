import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { getDB, resetDBForTests } from "../storage/db";
import {
  enqueue,
  listOperations,
  listOperationsForUser,
  pendingCount,
  pendingCountForUser,
  removeOperation,
  discardOperationsForRecord,
  clearQueue,
  hasPendingOperations,
} from "../sync/queue-store";
import { createSyncOperation } from "../sync/types";

beforeEach(async () => {
  resetDBForTests();
  const db = await getDB();
  await db.clear("qr-codes");
  await db.clear("sync-queue");
});

describe("SyncQueue", () => {
  it("adds operations and returns them in FIFO order", async () => {
    await enqueue(createSyncOperation("CREATE", "a", { name: "A" }));
    await enqueue(createSyncOperation("UPDATE", "b"));
    await enqueue(createSyncOperation("DELETE", "c"));
    const ops = await listOperations();
    expect(ops.map((o) => o.recordId)).toEqual(["a", "b", "c"]);
  });

  it("counts pending operations", async () => {
    await enqueue(createSyncOperation("CREATE", "a"));
    await enqueue(createSyncOperation("UPDATE", "b"));
    expect(await pendingCount()).toBe(2);
  });

  it("removes an operation", async () => {
    const op = createSyncOperation("CREATE", "a");
    await enqueue(op);
    await removeOperation(op.id);
    expect(await pendingCount()).toBe(0);
  });

  it("coalesces an UPDATE on top of a queued CREATE but keeps its payload fresh", async () => {
    const create = createSyncOperation("CREATE", "a", { name: "v1" });
    await enqueue(create);
    await enqueue(createSyncOperation("UPDATE", "a", { name: "v2" }));
    const ops = await listOperations();
    expect(ops).toHaveLength(1);
    expect(ops[0].operation).toBe("CREATE");
    expect((ops[0].payload as { name: string }).name).toBe("v2");
  });

  it("replaces a queued UPDATE with a newer UPDATE", async () => {
    await enqueue(createSyncOperation("UPDATE", "a", { name: "v1" }));
    await enqueue(createSyncOperation("UPDATE", "a", { name: "v2" }));
    const ops = await listOperations();
    expect(ops).toHaveLength(1);
    expect((ops[0].payload as { name: string }).name).toBe("v2");
  });

  it("a DELETE cancels queued CREATE/UPDATE for the same record", async () => {
    await enqueue(createSyncOperation("CREATE", "a", { name: "v1" }));
    await enqueue(createSyncOperation("UPDATE", "a", { name: "v2" }));
    await enqueue(createSyncOperation("DELETE", "a"));
    const ops = await listOperations();
    expect(ops).toHaveLength(1);
    expect(ops[0].operation).toBe("DELETE");
  });

  it("a CREATE after a queued DELETE replaces the DELETE", async () => {
    await enqueue(createSyncOperation("DELETE", "a"));
    await enqueue(createSyncOperation("CREATE", "a", { name: "again" }));
    const ops = await listOperations();
    expect(ops).toHaveLength(1);
    expect(ops[0].operation).toBe("CREATE");
    expect((ops[0].payload as { name: string }).name).toBe("again");
  });

  it("ignores a duplicate DELETE for the same record", async () => {
    await enqueue(createSyncOperation("DELETE", "a"));
    await enqueue(createSyncOperation("DELETE", "a"));
    expect(await pendingCount()).toBe(1);
  });

  it("discards all queued operations for a record", async () => {
    await enqueue(createSyncOperation("CREATE", "a"));
    await enqueue(createSyncOperation("UPDATE", "a"));
    await enqueue(createSyncOperation("DELETE", "b"));
    await discardOperationsForRecord("a");
    expect((await listOperations()).map((o) => o.recordId)).toEqual(["b"]);
  });

  it("clears the whole queue", async () => {
    await enqueue(createSyncOperation("CREATE", "a"));
    await clearQueue();
    expect(await pendingCount()).toBe(0);
  });

  it("reports whether a specific record has pending operations", async () => {
    await enqueue(createSyncOperation("CREATE", "a"));
    await enqueue(createSyncOperation("UPDATE", "b"));
    expect(await hasPendingOperations("a")).toBe(true);
    expect(await hasPendingOperations("b")).toBe(true);
    expect(await hasPendingOperations("c")).toBe(false);
  });

  it("scopes operations and counts per user", async () => {
    await enqueue(createSyncOperation("CREATE", "a", undefined, "user-A"));
    await enqueue(createSyncOperation("UPDATE", "b", undefined, "user-A"));
    await enqueue(createSyncOperation("CREATE", "c", undefined, "user-B"));
    await enqueue(createSyncOperation("DELETE", "d"));

    expect(await pendingCount()).toBe(4);
    expect(await pendingCountForUser("user-A")).toBe(3);
    expect(await pendingCountForUser("user-B")).toBe(2);
    expect(await pendingCountForUser("user-C")).toBe(1);

    const opsForA = await listOperationsForUser("user-A");
    expect(opsForA.map((o) => o.recordId).sort()).toEqual(["a", "b", "d"]);
    const opsForB = await listOperationsForUser("user-B");
    expect(opsForB.map((o) => o.recordId).sort()).toEqual(["c", "d"]);

    // A legacy op without a userId is attributed to whoever processes it so
    // pre-upgrade pending changes are never replayed into another account's
    // count twice over.
    const legacy = createSyncOperation("CREATE", "d");
    expect(legacy.userId).toBeNull();
  });

  it("a CREATE after a queued user-owned DELETE replaces the DELETE", async () => {
    await enqueue(createSyncOperation("DELETE", "a", undefined, "user-A"));
    await enqueue(createSyncOperation("CREATE", "a", { name: "again" }, "user-A"));
    const ops = await listOperationsForUser("user-A");
    expect(ops).toHaveLength(1);
    expect(ops[0].operation).toBe("CREATE");
  });
});