import type { Metadata } from "next";
import { Footer } from "@/components/home/Footer";
import { Navbar } from "@/components/ui/Navbar";
import { ProfileClient } from "@/components/profile/ProfileClient";

export const metadata: Metadata = {
  title: "Astronaut Profile — Martian Map",
  description:
    "Create your Martian profile and replay every route you have planned across Mars.",
};

export default function ProfilePage() {
  return (
    <>
      <Navbar />
      <ProfileClient />
      <Footer />
    </>
  );
}
