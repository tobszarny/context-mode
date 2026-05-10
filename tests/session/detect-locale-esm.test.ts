import { describe, it, expect } from "vitest";
import { detectLocaleAndTz } from "../../src/session/analytics.js";

describe("detectLocaleAndTz", () => {
  it("CONTEXT_MODE_LOCALE env wins over everything", () => {
    const orig = process.env.CONTEXT_MODE_LOCALE;
    process.env.CONTEXT_MODE_LOCALE = "tr-TR";
    try {
      const { locale } = detectLocaleAndTz();
      expect(locale).toBe("tr-TR");
    } finally {
      if (orig === undefined) delete process.env.CONTEXT_MODE_LOCALE;
      else process.env.CONTEXT_MODE_LOCALE = orig;
    }
  });

  it("on macOS, AppleLocale beats LANG (regression: require() in ESM was throwing)", () => {
    if (process.platform !== "darwin") return;
    const orig = { lang: process.env.LANG, override: process.env.CONTEXT_MODE_LOCALE };
    delete process.env.CONTEXT_MODE_LOCALE;
    process.env.LANG = "en_US.UTF-8";
    try {
      // On dev box AppleLocale=en_TR — assert detection actually reached it.
      const { locale } = detectLocaleAndTz();
      // If require() shim threw, we'd fall through to LANG → "en-US".
      // With proper top-level import, we get AppleLocale → some "xx-TR" form.
      expect(locale.endsWith("-TR")).toBe(true);
    } finally {
      if (orig.lang === undefined) delete process.env.LANG;
      else process.env.LANG = orig.lang;
      if (orig.override !== undefined) process.env.CONTEXT_MODE_LOCALE = orig.override;
    }
  });
});
