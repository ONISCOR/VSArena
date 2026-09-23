import { SdkPage } from "@/components/pages/SdkPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("SDK", "Python SDK for VSArena.", "/sdk");

export default function Page() {
  return <SdkPage />;
}
