import type { Metadata } from "next";
import { HookBank } from "@/components/hooks/hook-bank";

export const metadata: Metadata = {
  title: "Hook Bank",
};

export default function HooksPage() {
  return <HookBank />;
}
