import { AccountView } from "@/components/account/AccountView";
import { loadAccountContext } from "@/lib/account/load";
import { dict } from "@/lib/i18n/messages";
import { getRequestLocale } from "@/lib/i18n/server";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * Localized OG title for the signed-in settings desk.
 */
export async function generateMetadata() {
  const a = dict(getRequestLocale()).account;
  return pageMetadata(a.settingsTitle, a.settingsLead, "/account");
}

/**
 * Settings after sign-in: profile, key, agents, official runs, privacy.
 */
export default async function AccountPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const ctx = await loadAccountContext();
  return <AccountView ctx={ctx} tab={searchParams.tab} />;
}
