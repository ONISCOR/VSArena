/** Assumption: public identity is Aran Kair; the lab/org is ONISCOR. Mailbox is the Gmail below. */

import { GITHUB_REPO, ORG_NAME } from "@/lib/content";

export const LEGAL_UPDATED_ISO = "2026-09-14";

const DEFAULT_CONTROLLER = "Aran Kair";
const DEFAULT_EMAIL = "arankair.dev@gmail.com";

/**
 * Public display name of the controller.
 */
export function legalController(): string {
  const fromEnv = process.env.NEXT_PUBLIC_LEGAL_CONTROLLER?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_CONTROLLER;
}

/**
 * Contact mailbox for privacy requests.
 */
export function legalEmail(): string | null {
  const fromEnv = process.env.NEXT_PUBLIC_LEGAL_EMAIL?.trim();
  if (fromEnv && fromEnv.includes("@")) return fromEnv;
  return DEFAULT_EMAIL;
}

export function legalGithub(): string {
  return GITHUB_REPO;
}

export function legalOrg(): string {
  return ORG_NAME;
}

export interface LegalVars {
  controller: string;
  email: string;
  github: string;
  org: string;
  updatedIt: string;
  updatedEn: string;
}

/**
 * Values interpolated into legal copy (`{controller}`, `{email}`, `{github}`, `{org}`).
 */
export function legalVars(): LegalVars {
  const email = legalEmail();
  return {
    controller: legalController(),
    email: email ?? legalGithub(),
    github: legalGithub(),
    org: legalOrg(),
    updatedIt: "14 settembre 2026",
    updatedEn: "14 September 2026",
  };
}

/**
 * Replace `{controller}` / `{email}` / `{github}` / `{org}` / `{updatedIt}` / `{updatedEn}` in a legal string.
 */
export function fillLegal(template: string, vars: LegalVars): string {
  return template
    .replace(/\{controller\}/g, vars.controller)
    .replace(/\{email\}/g, vars.email)
    .replace(/\{github\}/g, vars.github)
    .replace(/\{org\}/g, vars.org)
    .replace(/\{updatedIt\}/g, vars.updatedIt)
    .replace(/\{updatedEn\}/g, vars.updatedEn);
}
