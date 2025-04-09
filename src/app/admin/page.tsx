"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: "USER" | "MODERATOR" | "ADMIN";
  createdAt: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const { user } = useKindeBrowserClient();

  useEffect(() => {
    async function checkAdminStatus() {
      const response = await fetch("/api/admin/check");
      const data = await response.json();

      if (!data.isAdmin) {
        router.push("/dashboard");
        return;
      }

      setIsAdmin(true);
      loadUsers();
    }

    checkAdminStatus();
  }, [router]);

  async function loadUsers(searchQuery = "") {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users?search=${searchQuery}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadUsers(search);
  }

  async function updateUserRole(userId: string, newRole: string) {
    try {
      const response = await fetch("/api/admin/users/update-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await response.json();

      if (data.success) {
        // Update the user in the local state
        setUsers(
          users.map((user) =>
            user.id === userId
              ? { ...user, role: newRole as "USER" | "MODERATOR" | "ADMIN" }
              : user,
          ),
        );
      }
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  }

  if (!isAdmin) {
    return <div className="p-8 text-center">Checking permissions...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">User Management</h1>

      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name or email..."
            className="flex-grow rounded-md border border-gray-300 p-2"
          />
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-white"
          >
            Search
          </button>
        </form>
      </div>

      {loading ? (
        <div className="text-center">Loading users...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Role</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{user.name || "N/A"}</td>
                    <td className="p-2">{user.email || "N/A"}</td>
                    <td className="p-2">
                      <span
                        className={`inline-block rounded-full px-2 py-1 text-xs ${
                          user.role === "ADMIN"
                            ? "bg-red-100 text-red-800"
                            : user.role === "MODERATOR"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-2">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          updateUserRole(user.id, e.target.value)
                        }
                        disabled={user.email === "tohoangviet1998@gmail.com"} // Protect your admin account
                        className="rounded border p-1"
                      >
                        <option value="USER">User</option>
                        <option value="MODERATOR">Moderator</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
