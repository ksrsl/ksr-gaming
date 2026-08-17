import type { Metadata } from "next";
import KSRGaming from "./KSRGaming";

export const metadata: Metadata = {
  title: "KSR Gaming",
  description: "A premium browser-game console built for Second Life.",
};

export default function Home() {
  return <KSRGaming />;
}
