import type React from "react";
import "@/app/globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "../context/auth-context";
import NavBar from "@/components/nav-bar";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Team Leader Co-Pilot",
  description:
    "An intelligent assistant designed to streamline leadership tasks in software development teams.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-screen">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              }
            >
              <div className="flex min-h-screen flex-col">
                <NavBar />
                <main className="flex-1 bg-gray-50">{children}</main>
              </div>
            </Suspense>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
