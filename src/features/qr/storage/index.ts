import { createQRRepository } from "./indexeddb";
import type { QRRepository } from "./types";

export * from "./types";
export * from "./indexeddb";
export * from "./backup";
export * from "./utils";

export const qrRepository: QRRepository = createQRRepository();