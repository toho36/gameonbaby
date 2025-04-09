import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const prisma = new PrismaClient();

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
      return NextResponse.json({ isModerator: false }, { status: 401 });
    }

    // Find the user in our database
    const user = (await prisma.user.findFirst({
      where: {
        OR: [{ email: kindeUser.email }],
      },
    })) as unknown as DbUser;

    if (!user) {
      return NextResponse.json({ isModerator: false });
    }

    // Check if user is a moderator or admin
    const isModerator = user.role === "MODERATOR" || user.role === "ADMIN";

    return NextResponse.json({ isModerator });
  } catch (error) {
    console.error("Error checking moderator status:", error);
    return NextResponse.json(
      { isModerator: false, error: "Failed to check moderator status" },
      { status: 500 },
    );
  }
}
