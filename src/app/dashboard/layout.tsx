import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={inter.variable}>
      <DashboardLayout>{children}</DashboardLayout>
    </div>
  );
}
