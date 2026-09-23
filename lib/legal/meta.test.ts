import { describe, expect, it } from "vitest";
import { fillLegal } from "@/lib/legal/meta";

describe("fillLegal", () => {
  it("interpolates controller and github", () => {
    const text = fillLegal("Titolare: {controller}. Repo: {github}. Lab: {org}", {
      controller: "Ada",
      email: "ada@example.com",
      github: "https://github.com/ONISCOR/VSArena",
      org: "ONISCOR",
      updatedIt: "1 settembre 2026",
      updatedEn: "1 September 2026",
    });
    expect(text).toContain("Ada");
    expect(text).toContain("https://github.com/ONISCOR/VSArena");
    expect(text).toContain("ONISCOR");
  });

  it("interpolates update dates", () => {
    const text = fillLegal("{updatedIt} / {updatedEn}", {
      controller: "Ada",
      email: "ada@example.com",
      github: "https://github.com/ONISCOR/VSArena",
      org: "ONISCOR",
      updatedIt: "14 settembre 2026",
      updatedEn: "14 September 2026",
    });
    expect(text).toBe("14 settembre 2026 / 14 September 2026");
  });
});
