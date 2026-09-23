"use client";

import { useI18n } from "@/components/i18n/LocaleProvider";
import { PageHero } from "@/components/site/PageHero";
import { cookiesDocument } from "@/lib/legal/cookies";
import { fillLegal, legalVars } from "@/lib/legal/meta";
import { privacyDocument } from "@/lib/legal/privacy";
import { termsDocument } from "@/lib/legal/terms";
import type { LegalBlock, LegalDocument } from "@/lib/legal/types";

interface LegalViewProps {
  kind: "privacy" | "terms" | "cookies";
}

/**
 * Full privacy, terms or cookie text in the active language.
 */
export function LegalView({ kind }: LegalViewProps) {
  const { locale } = useI18n();
  const vars = legalVars();
  const doc: LegalDocument =
    kind === "privacy" ? privacyDocument(locale) : kind === "terms" ? termsDocument(locale) : cookiesDocument(locale);
  const fill = (text: string) => fillLegal(text, vars);

  return (
    <>
      <PageHero kicker={doc.kicker} title={doc.title} lead={fill(doc.updatedLine)}>
        <div className="max-w-2xl space-y-4 text-base leading-7 text-[var(--mute)]">
          {doc.intro.map((p) => (
            <p key={p.slice(0, 48)}>{fill(p)}</p>
          ))}
        </div>
      </PageHero>
      <div className="mx-auto max-w-[1100px] px-5 pb-28 md:px-8">
        <div className="max-w-2xl">
          {doc.sections.map((section) => (
            <section key={section.title} className="mt-12 first:mt-0">
              <h2 className="text-xl font-semibold tracking-tight text-[var(--ink)]">{section.title}</h2>
              <div className="mt-4 space-y-4 text-base leading-7 text-[var(--mute)]">
                {section.blocks.map((block, index) => (
                  <LegalBlockView key={`${section.title}-${index}`} block={block} fill={fill} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}

function LegalBlockView({ block, fill }: { block: LegalBlock; fill: (text: string) => string }) {
  if ("p" in block) {
    return <p>{fill(block.p)}</p>;
  }
  return (
    <ul className="list-disc space-y-2 pl-5">
      {block.ul.map((item) => (
        <li key={item.slice(0, 64)}>{fill(item)}</li>
      ))}
    </ul>
  );
}
