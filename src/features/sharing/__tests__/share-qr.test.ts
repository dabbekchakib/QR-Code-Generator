import { describe, it, expect, afterEach, vi } from "vitest";
import { shareQRCode } from "@/features/qr/lib/qr-share";

vi.mock("@/features/qr/lib/qr-renderer", () => ({
  renderQRToDataURL: vi.fn().mockResolvedValue("data:image/png;base64,AAAA"),
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubNavigator({
  share,
  canShare,
  clipboard,
}: {
  share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
  canShare?: (data: { files: File[] }) => boolean;
  clipboard?: { writeText: (t: string) => Promise<void> };
}) {
  const nav: Record<string, unknown> = {};
  if (share) nav.share = share;
  if (canShare) nav.canShare = canShare;
  if (clipboard) nav.clipboard = clipboard;
  vi.stubGlobal("navigator", nav);
}

const abortError = () => new DOMException("User cancelled", "AbortError");

describe("shareQRCode", () => {
  it("shares the generated PNG file when file sharing is supported", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    stubNavigator({
      share,
      canShare: () => true,
      clipboard: { writeText: vi.fn() },
    });
    // The PNG path is guarded by `document` availability (buildPngFile).
    vi.stubGlobal("document", {});
    const result = await shareQRCode({
      content: "https://app.example/qr/abc",
      name: "Menu",
      customization: {} as never,
    });
    expect(result).toBe("shared");
    expect(share).toHaveBeenCalledTimes(1);
    const arg = share.mock.calls[0][0] as { files?: File[] };
    expect(arg.files?.[0]?.name).toBe("qr-manager-Menu.png");
    expect(arg.files?.[0]?.type).toBe("image/png");
  });

  it("shares plain text when no design is provided", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    stubNavigator({ share, clipboard: { writeText: vi.fn() }, canShare: () => true });
    const result = await shareQRCode({ content: "WIFI:T:WPA;S:net;;", name: "WiFi" });
    expect(result).toBe("shared");
    expect(share).toHaveBeenCalledWith({
      title: "WiFi",
      text: "WIFI:T:WPA;S:net;;",
    });
  });

  it("counts a user cancellation as aborted", async () => {
    stubNavigator({
      share: vi.fn().mockRejectedValue(abortError()),
      canShare: () => true,
      clipboard: { writeText: vi.fn() },
    });
    const result = await shareQRCode({ content: "x", name: "x" });
    expect(result).toBe("aborted");
  });

  it("copies the content when native sharing fails for another reason", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubNavigator({
      share: vi.fn().mockRejectedValue(new Error("browser refused")),
      canShare: () => true,
      clipboard: { writeText },
    });
    const result = await shareQRCode({ content: "fallback link", name: "x" });
    expect(result).toBe("copied");
    expect(writeText).toHaveBeenCalledWith("fallback link");
  });

  it("copies the link when the Web Share API is absent", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubNavigator({ clipboard: { writeText } });
    const result = await shareQRCode({ content: "https://app.example/qr/abc", name: "x" });
    expect(result).toBe("copied");
    expect(writeText).toHaveBeenCalledWith("https://app.example/qr/abc");
  });

  it("reports failure when neither share nor clipboard work", async () => {
    stubNavigator({});
    const result = await shareQRCode({ content: "x", name: "x" });
    expect(result).toBe("failed");
  });
});