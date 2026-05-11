import type { Metadata } from "next";
import { HooksGenerator } from "@/components/hooks/hooks-generator";

export const metadata: Metadata = {
  title: "Hooks",
};

export default function HooksPage() {
  return <HooksGenerator />;
}
