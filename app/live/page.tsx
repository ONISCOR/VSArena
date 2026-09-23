import { redirect } from "next/navigation";

/**
 * Live spectator lives inside Studio (`?view=live`). Keep /live as a short alias.
 */
export default function LiveRedirectPage() {
  redirect("/simulation?view=live");
}
