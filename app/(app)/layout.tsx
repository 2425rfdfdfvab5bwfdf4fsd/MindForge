import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { Header } from "@/components/layout/Header";

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
    </div>
  );
}
