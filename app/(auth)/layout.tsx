import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Sign In | MindForge" },
  description:
    "Sign in or create your free MindForge account to access your AI accountability coach and habit tracker.",
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
