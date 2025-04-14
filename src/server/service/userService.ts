"use server";

import { PrismaClient, UserRole } from "@prisma/client";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const prisma = new PrismaClient();

export async function syncKindeUser() {
  try {
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser || !kindeUser.id || !kindeUser.email) {
      throw new Error("User not authenticated");
    }

    let user = await prisma.user.findUnique({
      where: { kindeId: kindeUser.id },
    });

    if (!user) {
      user = await prisma.user.findUnique({
        where: { email: kindeUser.email },
      });

      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { kindeId: kindeUser.id },
        });
      } else {
        user = await prisma.user.create({
          data: {
            kindeId: kindeUser.id,
            email: kindeUser.email,
            name: `${kindeUser.given_name || ""} ${kindeUser.family_name || ""}`.trim(),
            role: UserRole.USER,
          },
        });
      }
    }

    return user;
  } catch (error) {
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    return await syncKindeUser();
  } catch (error) {
    return null;
  }
}

export async function getAllUsers(search?: string) {
  try {
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    return await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    return [];
  }
}

export async function updateUserRole(userId: string, newRole: UserRole) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      throw new Error("Unauthorized: Only admins can change user roles");
    }

    return await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
  } catch (error) {
    throw error;
  }
}

export async function isUserAdmin() {
  try {
    const user = await getCurrentUser();
    return user?.role === UserRole.ADMIN;
  } catch (error) {
    return false;
  }
}

export async function isUserModerator() {
  try {
    const user = await getCurrentUser();
    return user?.role === UserRole.MODERATOR || user?.role === UserRole.ADMIN;
  } catch (error) {
    return false;
  }
}

export async function isUserRegular() {
  try {
    const user = await getCurrentUser();
    return (
      user?.role === UserRole.USER ||
      user?.role === UserRole.MODERATOR ||
      user?.role === UserRole.ADMIN
    );
  } catch (error) {
    return false;
  }
}

export async function hasSpecialAccess() {
  try {
    const user = await getCurrentUser();
    return (
      user?.role === UserRole.USER ||
      user?.role === UserRole.MODERATOR ||
      user?.role === UserRole.ADMIN
    );
  } catch (error) {
    return false;
  }
}
