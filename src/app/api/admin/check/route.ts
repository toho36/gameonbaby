import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "~/lib/db";

// Define user interface with role property
interface DbUser {
  id: string;
  name: string | null;
  email: string | null;
  role: "USER" | "MODERATOR" | "ADMIN";
  emailVerified: Date | null;
  image: string | null;
}

export async function GET() {
  try {
    // Get the authenticated user
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser || !kindeUser.id) {
      return NextResponse.json(
        { isAdmin: false, isModerator: false },
        { status: 401 },
      );
    }

    // Find the user in our database
    const user = (await prisma.user.findFirst({
      where: {
        OR: [{ email: kindeUser.email }],
      },
    })) as unknown as DbUser;

    // If it's the first user to log in, make them an admin
    if (!user) {
      // Check if there are any users in the system
      const userCount = await prisma.user.count();

      if (userCount === 0) {
        // Create first user as admin
        await prisma.user.create({
          data: {
            email: kindeUser.email ?? "",
            name: `${kindeUser.given_name || ""} ${kindeUser.family_name || ""}`.trim(),
            // @ts-ignore: Property 'role' does not exist
            role: "ADMIN", // Make first user admin
          },
        });

        return NextResponse.json({ isAdmin: true, isModerator: false });
      }

      return NextResponse.json({ isAdmin: false, isModerator: false });
    }

    // Check user roles
    const isAdmin = user.role === "ADMIN";
    const isModerator = user.role === "MODERATOR" || isAdmin; // Admins have moderator privileges

    return NextResponse.json({ isAdmin, isModerator });
  } catch (error) {
    console.error("Error checking admin status:", error);
    return NextResponse.json(
      {
        isAdmin: false,
        isModerator: false,
        error: "Failed to check admin status",
      },
      { status: 500 },
    );
  }
}
