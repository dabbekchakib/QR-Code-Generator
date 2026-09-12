import { describe, it, expect } from "vitest";
import {
  legalContent,
  legalUiLabels,
  getLegalLocale,
  resolveLegalContent,
  isRtl,
} from "../legal-content";
import { defaultLocale, locales } from "@/i18n/config";

describe("legalContent", () => {
  it("defines complete pages for every supported locale", () => {
    for (const locale of locales) {
      for (const kind of ["privacy", "terms"] as const) {
        const page = legalContent[locale][kind];
        expect(page.title.length).toBeGreaterThan(0);
        expect(page.description.length).toBeGreaterThan(0);
        expect(page.lastUpdated.length).toBeGreaterThan(0);
        expect(page.sections.length).toBeGreaterThan(5);
        for (const section of page.sections) {
          expect(section.heading.length).toBeGreaterThan(0);
          expect(section.paragraphs.length).toBeGreaterThan(0);
          for (const paragraph of section.paragraphs) {
            expect(paragraph.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it("keeps section count consistent across locales", () => {
    const counts = locales.map((locale) =>
      (["privacy", "terms"] as const).map(
        (kind) => legalContent[locale][kind].sections.length
      )
    );
    const first = counts[0];
    for (const count of counts.slice(1)) {
      expect(count).toEqual(first);
    }
  });

  it("provides localized chrome labels for every locale", () => {
    for (const locale of locales) {
      expect(legalUiLabels[locale].updatedLabel.length).toBeGreaterThan(0);
      expect(legalUiLabels[locale].backHome.length).toBeGreaterThan(0);
    }
  });
});

describe("getLegalLocale", () => {
  it("uses the persisted locale when valid", () => {
    expect(getLegalLocale("ar")).toBe("ar");
    expect(getLegalLocale("en")).toBe("en");
  });

  it("falls back for invalid or missing cookie values", () => {
    expect(getLegalLocale("de")).toBe(defaultLocale);
    expect(getLegalLocale(undefined)).toBe(defaultLocale);
  });
});

describe("resolveLegalContent", () => {
  it("selects the right page for a cookie value", () => {
    expect(resolveLegalContent("privacy", "ar").title).toBe(
      legalContent.ar.privacy.title
    );
    expect(resolveLegalContent("terms", "en").sections.length).toBe(
      legalContent.en.terms.sections.length
    );
  });
});

describe("isRtl", () => {
  it("detects the RTL locale", () => {
    expect(isRtl("ar")).toBe(true);
    expect(isRtl("fr")).toBe(false);
    expect(isRtl("en")).toBe(false);
  });
});