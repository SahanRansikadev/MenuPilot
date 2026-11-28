import type { Metadata } from "next";
import "./globals.css";
import ChatWidget from "./components/chat-widget";
export const metadata: Metadata = {
  title: "MenuPilot | Food & Event Management",
  description: "Plan beautiful menus, coordinate kitchens and manage unforgettable events with MenuPilot."
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<ChatWidget /></body></html>;
}