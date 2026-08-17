import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KSR Gaming",
  description: "A premium browser-game console built for Second Life.",
  icons: { icon: "/ksr-gaming.svg", shortcut: "/ksr-gaming.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
