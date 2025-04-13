"use server";

import { PrismaClient, UserRole } from "@prisma/client";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const prisma = new PrismaClient();

export async function syncKindeUser() {
  try {
    console.log("Starting syncKindeUser process...");
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    console.log("Kinde user data:", {
      id: kindeUser?.id,
      email: kindeUser?.email,
      name: `${kindeUser?.given_name || ""} ${kindeUser?.family_name || ""}`.trim(),
    });

    if (!kindeUser || !kindeUser.id || !kindeUser.email) {
      console.error("User not authenticated or missing required fields");
      throw new Error("User not authenticated");
    }

    // Check if user exists in our database
    let user = await prisma.user.findUnique({
      where: { kindeId: kindeUser.id },
    });

    console.log("User found by kindeId:", user ? user.id : "none");

    if (!user) {
      // If user doesn't exist, check by email
      user = await prisma.user.findUnique({
        where: { email: kindeUser.email },
      });

      console.log("User found by email:", user ? user.id : "none");

      if (user) {
        // If found by email, update the kindeId
        console.log("Updating existing user with kindeId");
        user = await prisma.user.update({
          where: { id: user.id },
          data: { kindeId: kindeUser.id },
        });
      } else {
        // Create new user
        console.log("Creating new user");
        user = await prisma.user.create({
          data: {
            kindeId: kindeUser.id,
            email: kindeUser.email,
            name: `${kindeUser.given_name || ""} ${kindeUser.family_name || ""}`.trim(),
            role: UserRole.USER,
          },
        });
        console.log("New user created:", user.id);
      }
    }

    return user;
  } catch (error) {
    console.error("Error in syncKindeUser:", error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    return await syncKindeUser();
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

export async function getAllUsers(search?: string) {
  try {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    return await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error getting users:", error);
    return [];
  }
}

export async function updateUserRole(userId: string, newRole: UserRole) {
  try {
    // First check if the current user is an admin
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      throw new Error("Unauthorized: Only admins can change user roles");
    }

    return await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
}

export async function isUserAdmin() {
  try {
    const user = await getCurrentUser();
    return user?.role === UserRole.ADMIN;
  } catch (error) {
    console.error("Error checking if user is admin:", error);
    return false;
  }
}

export async function isUserModerator() {
  try {
    const user = await getCurrentUser();
    return user?.role === UserRole.MODERATOR || user?.role === UserRole.ADMIN;
  } catch (error) {
    console.error("Error checking if user is moderator:", error);
    return false;
  }
}

export async function isUserRegular() {
  try {
    const user = await getCurrentUser();
    return (
      user?.role === UserRole.REGULAR ||
      user?.role === UserRole.MODERATOR ||
      user?.role === UserRole.ADMIN
    );
  } catch (error) {
    console.error("Error checking if user can view hidden events:", error);
    return false;
  }
}

export async function hasSpecialAccess() {
  try {
    const user = await getCurrentUser();
    return (
      user?.role === UserRole.REGULAR ||
      user?.role === UserRole.MODERATOR ||
      user?.role === UserRole.ADMIN
    );
  } catch (error) {
    console.error("Error checking for special access:", error);
    return false;
  }
}
