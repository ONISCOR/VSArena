import { describe, expect, it } from "vitest";
import { cookiesDocument } from "@/lib/legal/cookies";
import { fillLegal, legalVars } from "@/lib/legal/meta";
import { privacyDocument } from "@/lib/legal/privacy";
import { termsDocument } from "@/lib/legal/terms";
import type { LegalDocument } from "@/lib/legal/types";

function flatten(doc: LegalDocument, vars = legalVars()): string {
  const parts = [doc.title, doc.updatedLine, ...doc.intro];
  for (const section of doc.sections) {
    parts.push(section.title);
    for (const block of section.blocks) {
      if ("p" in block) parts.push(block.p);
      else parts.push(...block.ul);
    }
  }
  return fillLegal(parts.join("\n"), vars);
}

describe("legal documents", () => {
  it("names Aran Kair as natural-person controller, not a company", () => {
    const vars = legalVars();
    expect(vars.controller).toBe("Aran Kair");
    expect(vars.email).toBe("arankair.dev@gmail.com");

    for (const locale of ["it", "en"] as const) {
      const privacy = flatten(privacyDocument(locale), vars);
      const terms = flatten(termsDocument(locale), vars);
      const cookies = flatten(cookiesDocument(locale), vars);
      const all = `${privacy}\n${terms}\n${cookies}`;

      expect(all).toContain("Aran Kair");
      expect(all).toContain("arankair.dev@gmail.com");
      expect(all).toContain("ONISCOR");
      expect(all).toMatch(/Playground/);
      expect(all).toContain("vsarena-locale");
      expect(privacy).toMatch(/V1/);
      expect(cookies).toMatch(/122/);
    }

    const itPrivacy = flatten(privacyDocument("it"), vars);
    expect(itPrivacy).toMatch(/non è una società|non è una persona giuridica/i);
    expect(itPrivacy).toMatch(/pseudonimo/);
    expect(itPrivacy.toLowerCase()).not.toContain("novacodingg");
  });
});
