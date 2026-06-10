import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Header } from "@/components/layout/Header";
import { Toaster } from "sonner";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-forge-base">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main area — offset by sidebar width on desktop */}
      <div className="flex min-h-screen flex-col lg:pl-[240px]">
        <Header />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* Toast notifications — forge dark theme */}
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "#232220",
            border: "1px solid #2A2927",
            color: "#EDEDEF",
            fontFamily: "var(--font-geist-sans)",
          },
          classNames: {
            success: "border-[#FF6B2B]",
          },
        }}
        position="top-right"
        richColors={false}
      />
    </div>
  );
}
