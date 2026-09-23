import { LegalPage } from "@/components/pages/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("Cookies", "Informativa cookie VSArena. Solo storage tecnico.", "/cookies");

export default function Page() {
  return <LegalPage kind="cookies" />;
}
