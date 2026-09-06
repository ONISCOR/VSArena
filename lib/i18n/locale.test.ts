import { describe, expect, it } from "vitest";
import { parseLocale, resolveLocale } from "@/lib/i18n/locale";
import { fill, messages } from "@/lib/i18n/messages";

describe("parseLocale", () => {
  it("reads it and en prefixes", () => {
    expect(parseLocale("it-IT")).toBe("it");
    expect(parseLocale("en-US,en;q=0.9")).toBe("en");
    expect(parseLocale("fr")).toBeNull();
  });
});

describe("resolveLocale", () => {
  it("prefers cookie over Accept-Language", () => {
    expect(resolveLocale("en", "it-IT")).toBe("en");
    expect(resolveLocale(undefined, "it-IT,it;q=0.9")).toBe("it");
    expect(resolveLocale(undefined, undefined)).toBe("en");
  });
});

describe("messages", () => {
  it("keeps the same keys in Italian", () => {
    expect(Object.keys(messages.it)).toEqual(Object.keys(messages.en));
    expect(Object.keys(messages.it.submit)).toEqual(Object.keys(messages.en.submit));
    expect(Object.keys(messages.it.about)).toEqual(Object.keys(messages.en.about));
    expect(Object.keys(messages.it.studio)).toEqual(Object.keys(messages.en.studio));
    expect(Object.keys(messages.it.board)).toEqual(Object.keys(messages.en.board));
    expect(Object.keys(messages.it.account)).toEqual(Object.keys(messages.en.account));
    expect(Object.keys(messages.it.board.badges)).toEqual(Object.keys(messages.en.board.badges));
    expect(Object.keys(messages.it.docs)).toEqual(Object.keys(messages.en.docs));
    expect(Object.keys(messages.it.landing)).toEqual(Object.keys(messages.en.landing));
    expect(Object.keys(messages.it.changelog)).toEqual(Object.keys(messages.en.changelog));
    expect(Object.keys(messages.it.ui)).toEqual(Object.keys(messages.en.ui));
  });

  it("fills placeholders", () => {
    expect(fill("Sei {name}.", { name: "ada" })).toBe("Sei ada.");
  });
});
