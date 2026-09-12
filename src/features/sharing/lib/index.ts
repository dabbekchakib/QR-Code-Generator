export {
  shareQRCode,
  canShareNative,
  canSharePngFiles,
  type ShareOptions,
  type ShareResult,
} from "@/features/qr/lib/qr-share";

export {
  copyToClipboard,
  type CopyResult,
} from "@/features/qr/lib/qr-clipboard";

export {
  downloadPNG,
  downloadSVG,
  sanitizeFilename,
} from "@/features/qr/lib/qr-download";

export {
  getShareText,
  getShareMetadata,
  isWellFormedHttpUrl,
  destinationHost,
  type ShareMetadata,
} from "./share-metadata";

export {
  parseSafeUrl,
  isSafeUrl,
  type SafeUrlResult,
} from "./open-safe-url";

export type { ShareTarget } from "../types";
export { useQRPublication, type PublicationStatus, type PublicationState } from "@/features/qr/hooks/use-qr-publication";