"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/auth-context";
import { FileAudio, LogOut, User, List, FileText } from "lucide-react";

export default function NavBar() {
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();

  if (!isAuthenticated) return null;

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <List className="h-5 w-5" />,
    },
    {
      href: "/upload-audio",
      label: "Upload Audio",
      icon: <FileAudio className="h-5 w-5" />,
    },
    {
      href: "/upload-transcription",
      label: "Upload Transcription",
      icon: <FileText className="h-5 w-5" />,
    },
    // Add other navigation items as needed
  ];

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center font-bold text-blue-600"
            >
              <span>TL CoPilot</span>
            </Link>

            <div className="ml-10 hidden space-x-4 md:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium ${
                    pathname === item.href
                      ? "text-blue-600"
                      : "text-gray-700 hover:text-blue-600"
                  }`}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            {user && (
              <div className="flex items-center">
                <div className="hidden md:block">
                  <div className="flex items-center">
                    <button className="flex items-center rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <span className="sr-only">Open user menu</span>
                      {user.avatar ? (
                        <img
                          className="h-8 w-8 rounded-full"
                          src={user.avatar}
                          alt="User avatar"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-500">
                          <User className="h-5 w-5" />
                        </div>
                      )}
                      <span className="ml-2 text-gray-700">
                        {user.name || "User"}
                      </span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="ml-4 flex items-center rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
