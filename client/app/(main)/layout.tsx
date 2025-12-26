import type { ReactNode } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Toaster position="top-right" />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
