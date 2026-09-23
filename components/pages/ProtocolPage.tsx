"use client";

import { CodeBlock } from "@/components/site/CodeBlock";
import { PageHero } from "@/components/site/PageHero";
import { useI18n } from "@/lib/copy/useCopy";

const loop = `hello → state → action → … → result

# VLA state
# images.scene = 128×128 RGB
# instruction = stack sentence
# scene.blocks = []  (hidden on purpose)`;

export function ProtocolPage() {
  const { t } = useI18n();
  return (
    <PageHero kicker={t.protocol.kicker} title={t.protocol.title} lead={t.protocol.lead}>
      <CodeBlock code={loop} label="protocol" />
    </PageHero>
  );
}
