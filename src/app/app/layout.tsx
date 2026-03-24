import Sidebar from "@/components/app/Sidebar";

export const metadata = {
  title: "BUB Script System",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[240px] p-8 transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
