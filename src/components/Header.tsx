"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NotificationBell } from "./NotificationBell";

interface User {
  id: string;
  name: string;
  role: string;
}

export function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setUser(data?.user || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors"
        >
          Q&A Platform
        </Link>

        <nav className="flex items-center gap-4">
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          ) : user ? (
            <>
              <NotificationBell />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {user.name}
              </span>
              <Link
                href="/api/auth/logout"
                className="btn-ghost text-sm px-3 py-1.5"
              >
                Logout
              </Link>
            </>
          ) : (
            <Link href="/auth/login" className="btn-primary text-sm px-4 py-2">
              Sign In
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

