/** Public site copy. Honest: one founder, one lab, one task. */

export const ORG_NAME = "ONISCOR";
export const FOUNDER_NAME = "Aran Kair";

export const GITHUB_ORG = "https://github.com/ONISCOR";
export const GITHUB_REPO = "https://github.com/ONISCOR/VSArena";
export const GITHUB_FOUNDER = "https://github.com/arankair";

export const TEAM = [
  {
    name: FOUNDER_NAME,
    role: "Founder & engineer",
    bio: "Founder of ONISCOR. Builds the studio, the protocol, and the board.",
    href: GITHUB_FOUNDER,
  },
] as const;

export const PRINCIPLES = [
  {
    title: "Pixels on the VLA track",
    body: "The policy gets an image and a sentence. Scoring may use cube poses. The policy may not.",
  },
  {
    title: "The browser is not trusted",
    body: "Studio runs are for watching and debugging. Public ELO is written only by the harness.",
  },
  {
    title: "Say what exists",
    body: "This is a live stacking work-cell plus a scoreboard. It is not Isaac Sim and not a paper suite.",
  },
] as const;

export const HOW_IT_WORKS = [
  {
    n: "01",
    title: "Watch",
    body: "Open Studio V1. A 4-DOF arm, three cubes, a pad. Keyboard teleop if you want to try the task.",
  },
  {
    n: "02",
    title: "Act",
    body: "On the VLA track the policy sees a 128×128 image and a stack instruction. Actions are joint targets or end-effector deltas.",
  },
  {
    n: "03",
    title: "Score",
    body: "Accuracy and completion use the real poses. The harness posts ELO. The browser cannot.",
  },
] as const;
