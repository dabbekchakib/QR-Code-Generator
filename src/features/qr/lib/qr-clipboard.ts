export type CopyResult = {
  success: boolean;
  error?: string;
};

/**
 * Copy `text` to the clipboard: prefer the async Clipboard API, then fall back
 * to a textarea + execCommand when the browser hides the modern API (non-HTTPS,
 * older Safari, WebViews). Never throws; returns a structured result instead so
 * callers can show a friendly error instead of crashing the UI.
 */
export async function copyToClipboard(text: string): Promise<CopyResult> {
  if (!text) return { success: true };

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return { success: true };
    }
  } catch {
    // Fall through to the legacy path.
  }

  if (typeof document === "undefined") {
    return { success: false, error: "clipboard-unavailable" };
  }

  try {
    const ok = legacyCopy(text);
    return ok ? { success: true } : { success: false, error: "clipboard-unavailable" };
  } catch {
    return { success: false, error: "clipboard-unavailable" };
  }
}

function legacyCopy(text: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "-9999px";
  textarea.setAttribute("readonly", "");
  textarea.setAttribute("aria-hidden", "true");
  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, text.length);
  const ok = document.execCommand("copy");
  document.body.removeChild(textarea);
  return ok;
}