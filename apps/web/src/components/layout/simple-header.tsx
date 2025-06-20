"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Diff", href: "/diff" },
  { name: "Docs", href: "/docs" },
];

export function SimpleHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 dark:bg-gray-900/95 backdrop-blur dark:border-gray-800">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="mr-4 flex md:mr-8">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-6 w-6 rounded bg-blue-600"></div>
            <span className="font-bold text-xl dark:text-white">Diffit</span>
          </Link>
        </div>

        <nav className="hidden md:flex flex-1 items-center space-x-6 text-sm font-medium">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition-colors hover:text-gray-900 dark:hover:text-gray-100 ${
                pathname === item.href
                  ? "text-gray-900 dark:text-gray-100 font-semibold"
                  : "text-gray-600 dark:text-gray-400"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <ThemeToggle />
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 text-sm"
          >
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
}