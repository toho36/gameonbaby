"use client";

import {
  LoginLink,
  RegisterLink,
  LogoutLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Button } from "~/shared/components/ui/button";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import AuthCheck from "~/shared/components/AuthCheck";

export default function Navbar() {
  const { user, isAuthenticated, isLoading } = useKindeBrowserClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check if user has admin roles
  useEffect(() => {
    if (isAuthenticated) {
      fetch("/api/admin/check")
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          console.log("Admin check response:", data);
          setIsAdmin(data.isAdmin);

          // If the user is admin, they're also a moderator
          if (data.isAdmin) {
            setIsModerator(true);
          } else {
            // Check if user is a moderator
            checkIfModerator();
          }
        })
        .catch((err) => {
          console.error("Error checking admin status:", err);
        });
    }
  }, [isAuthenticated]);

  // Function to check if user is a moderator
  async function checkIfModerator() {
    try {
      console.log("Checking moderator status...");
      const response = await fetch("/api/admin/check-moderator");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Moderator check response:", data);
      setIsModerator(data.isModerator);
    } catch (error) {
      console.error("Error checking moderator status:", error);
    }
  }

  return (
    <nav className="border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold">
              Gameonvb.cz
            </Link>

            {/* Main navigation links */}
            {isAuthenticated && !isLoading && (
              <AuthCheck>
                <div className="ml-10 hidden space-x-4 md:flex">
                  <Link
                    href="/"
                    className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Events
                  </Link>
                  {(isAdmin || isModerator) && (
                    <>
                      <Link
                        href="/admin/events"
                        className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Manage Events
                      </Link>
                      <Link
                        href="/admin/no-shows"
                        className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        No Shows
                      </Link>
                      <Link
                        href="/admin/event-stats"
                        className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                      >
                        Event Statistics
                      </Link>
                      {isAdmin && (
                        <>
                          <Link
                            href="/admin/registration-history"
                            className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                          >
                            Registration History
                          </Link>
                          <Link
                            href="/admin"
                            className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                          >
                            User Management
                          </Link>
                        </>
                      )}
                    </>
                  )}
                </div>
              </AuthCheck>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {isLoading ? (
              // Show loading state
              <div className="h-8 w-20 animate-pulse rounded-md bg-gray-200"></div>
            ) : isAuthenticated ? (
              <AuthCheck
                fallback={
                  <div className="flex space-x-2">
                    <LoginLink postLoginRedirectURL="/">
                      <Button variant="outline">Sign in</Button>
                    </LoginLink>
                  </div>
                }
              >
                <div className="flex items-center space-x-4">
                  {/* Mobile menu button - only visible on small screens */}
                  <button
                    className="rounded-md p-2 text-gray-700 hover:bg-gray-100 md:hidden"
                    onClick={() => setMenuOpen(!menuOpen)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-6 w-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                      />
                    </svg>
                  </button>

                  {/* User profile and logout */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      className="flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                      onClick={() => setMenuOpen(!menuOpen)}
                    >
                      <span className="hidden md:inline">
                        {user?.given_name} {user?.family_name}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="h-5 w-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </button>

                    {/* Dropdown menu */}
                    {menuOpen && (
                      <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                        {/* Mobile-only navigation items */}
                        <div className="md:hidden">
                          <Link
                            href="/"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setMenuOpen(false)}
                          >
                            Events
                          </Link>
                          {(isAdmin || isModerator) && (
                            <>
                              <Link
                                href="/admin/events"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => setMenuOpen(false)}
                              >
                                Manage Events
                              </Link>
                              <Link
                                href="/admin/no-shows"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => setMenuOpen(false)}
                              >
                                No Shows
                              </Link>
                              <Link
                                href="/admin/event-stats"
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                onClick={() => setMenuOpen(false)}
                              >
                                Event Statistics
                              </Link>
                              {isAdmin && (
                                <>
                                  <Link
                                    href="/admin/registration-history"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => setMenuOpen(false)}
                                  >
                                    Registration History
                                  </Link>
                                  <Link
                                    href="/admin"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => setMenuOpen(false)}
                                  >
                                    User Management
                                  </Link>
                                </>
                              )}
                            </>
                          )}
                          <div className="my-1 border-t border-gray-100"></div>
                        </div>

                        {/* Common dropdown items */}
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setMenuOpen(false)}
                        >
                          Your Profile
                        </Link>
                        <LogoutLink className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100">
                          Sign out
                        </LogoutLink>
                      </div>
                    )}
                  </div>
                </div>
              </AuthCheck>
            ) : (
              <>
                <LoginLink postLoginRedirectURL="/">
                  <Button variant="outline">Sign in</Button>
                </LoginLink>
                <RegisterLink postLoginRedirectURL="/">
                  <Button>Sign up</Button>
                </RegisterLink>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
