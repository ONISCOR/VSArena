import { AboutPage } from "@/components/pages/AboutPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata(
  "About",
  "A stacking task in the browser, a small protocol, and a scoreboard the client cannot write.",
  "/about",
);

export default function Page() {
  return <AboutPage />;
}
