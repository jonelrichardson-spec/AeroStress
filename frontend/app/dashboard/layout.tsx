import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-bg">
      <Sidebar />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
