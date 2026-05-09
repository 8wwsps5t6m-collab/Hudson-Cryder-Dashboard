import type { Metadata } from "next";
import { IdeaGenerator } from "@/components/ideas/idea-generator";

export const metadata: Metadata = {
  title: "Ideas",
};

export default function IdeasPage() {
  return <IdeaGenerator />;
}
