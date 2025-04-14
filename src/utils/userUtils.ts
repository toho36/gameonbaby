import prisma from "~/lib/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

/**
 * Fetches the user role from the database
 */
export async function getUserRole(userId: string): Promise<string | null> {
  try {
    console.log(`Fetching role for user ID: ${userId}`);

    // Try to find the user by kindeId
    let user = await prisma.user.findUnique({
      where: { kindeId: userId },
      select: { role: true },
    });

    if (!user) {
      console.log(
        `No user found with kindeId: ${userId}, trying to get Kinde user details...`,
      );

      // Get the Kinde user to try matching by email
      const { getUser } = getKindeServerSession();
      const kindeUser = await getUser();

      if (kindeUser?.email) {
        console.log(`Looking up user by email: ${kindeUser.email}`);

        // Try to find user by email
        user = await prisma.user.findUnique({
          where: { email: kindeUser.email },
          select: { role: true },
        });

        if (user) {
          console.log(
            `Found user with email ${kindeUser.email}, updating kindeId...`,
          );

          // Update the user with the kindeId for future lookups
          await prisma.user.update({
            where: { email: kindeUser.email },
            data: { kindeId: userId },
          });
        }
      }
    }

    if (!user) {
      console.log(`No user found with either kindeId or email`);
      return null;
    }

    console.log(`Found user with role: ${user.role}`);
    return user?.role?.toString() || null;
  } catch (error) {
    console.error(`Error fetching user role for ID ${userId}:`, error);
    return null;
  }
}
