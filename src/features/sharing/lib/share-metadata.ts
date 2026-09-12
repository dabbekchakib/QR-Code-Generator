import type { AnyFormValues } from "@/features/qr/types";

export interface ShareMetadata {
  /** Text handed to the system share sheet / clipboard. */
  text: string;
  /** Human-readable label, e.g. the QR name. */
  title: string;
  /** Note shown under the title (destination host, type…). */
  description?: string;
}

/**
 * The value a QR Code actually encodes. Dynamic codes always encode the
 * permanent public URL — their destination is intentionally never shared or
 * copied (editing the destination must not leak the previous target).
 */
export function getShareText(input: {
  isDynamic: boolean;
  content: string;
  permanentUrl?: string | null;
}): string {
  return input.isDynamic && input.permanentUrl ? input.permanentUrl : input.content;
}

export function getShareMetadata(input: {
  name: string;
  isDynamic: boolean;
  contentType?: string;
  content: string;
  permanentUrl?: string | null;
  destinationUrl?: string | null;
}): ShareMetadata {
  const text = getShareText(input);
  const description = input.isDynamic
    ? input.permanentUrl ?? undefined
    : isWellFormedHttpUrl(input.content)
      ? input.content
      : undefined;
  return {
    title: input.name,
    text,
    description,
  };
}

export function isWellFormedHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function destinationHost(values: AnyFormValues): string | undefined {
  if (values && "url" in values && typeof values.url === "string") {
    const parsed = isWellFormedHttpUrl(values.url)
      ? new URL(values.url)
      : null;
    return parsed?.host || undefined;
  }
  return undefined;
}