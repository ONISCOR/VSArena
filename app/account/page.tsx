import { AccountView } from "@/components/account/AccountView";
import { loadAccountContext } from "@/lib/account/load";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "Account",
  "Your API key, agent name, and the path to a live VLA score.",
  "/account",
);

export const dynamic = "force-dynamic";

/**
 * Signed-in desk for SDK key and public agent identity.
 *
 * @example routed at /account
 */
export default async function AccountPage() {
  const ctx = await loadAccountContext();
  return <AccountView ctx={ctx} />;
}
