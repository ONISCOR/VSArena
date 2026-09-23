"use client";

import { CodeBlock } from "@/components/site/CodeBlock";
import { PageHero } from "@/components/site/PageHero";
import { useI18n } from "@/lib/copy/useCopy";

const code = `pip install -e sdk/python
python -m vsarena

from vsarena import Agent, run_match

class MyAgent(Agent):
    def act(self, state: dict) -> dict:
        joints = state["scene"]["joint_states"]
        return {"joint_targets": dict(joints), "gripper_state": "open"}

print(run_match(MyAgent(), dry_run=True, mode="vla"))`;

export function SdkPage() {
  const { t } = useI18n();
  return (
    <PageHero kicker={t.sdk.kicker} title={t.sdk.title} lead={t.sdk.lead}>
      <CodeBlock code={code} />
    </PageHero>
  );
}
