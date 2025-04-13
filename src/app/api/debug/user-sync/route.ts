import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const prisma = new PrismaClient();

// Define user interface with role property
interface DbUser {
  id: string;
  name: string | null;
  email: string | null;
  role: "USER" | "REGULAR" | "MODERATOR" | "ADMIN";
  emailVerified: Date | null;
  image: string | null;
  kindeId: string | null;
  createdAt: Date;
}

export async function GET() {
  try {
    // Get the authenticated user
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser || !kindeUser.id) {
      return NextResponse.json(
        {
          success: false,
          message: "No authenticated user found",
          user: null,
        },
        { status: 401 },
      );
    }

    // Debug info to return
    const debugInfo = {
      kindeUser: {
        id: kindeUser.id,
        email: kindeUser.email,
        name: `${kindeUser.given_name || ""} ${kindeUser.family_name || ""}`.trim(),
      },
      databaseLookup: null,
      userCreated: false,
      finalUser: null,
    };

    // Look for user in database
    let user = (await prisma.user.findFirst({
      where: {
        OR: [{ kindeId: kindeUser.id }, { email: kindeUser.email }],
      },
    })) as unknown as DbUser | null;

    debugInfo.databaseLookup = {
      found: !!user,
      byId: user?.kindeId === kindeUser.id ? true : false,
      byEmail: user?.email === kindeUser.email ? true : false,
    };

    // If user doesn't exist, create them
    if (!user) {
      try {
        user = (await prisma.user.create({
          data: {
            kindeId: kindeUser.id,
            email: kindeUser.email ?? "",
            name: `${kindeUser.given_name || ""} ${kindeUser.family_name || ""}`.trim(),
            // @ts-ignore: Property 'role' does not exist
            role: "USER",
          },
        })) as unknown as DbUser;

        debugInfo.userCreated = true;
      } catch (error) {
        console.error("Error creating user:", error);
        return NextResponse.json(
          {
            success: false,
            message: "Failed to create user",
            debugInfo,
          },
          { status: 500 },
        );
      }
    }
    // If user exists but doesn't have kindeId, update it
    else if (user && user.kindeId !== kindeUser.id) {
      user = (await prisma.user.update({
        where: { id: user.id },
        data: {
          // @ts-ignore: Property 'kindeId' does not exist
          kindeId: kindeUser.id,
        },
      })) as unknown as DbUser;
    }

    // Now check if user exists after potential creation
    if (user) {
      debugInfo.finalUser = {
        id: user.id,
        kindeId: user.kindeId,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      };
    }

    return NextResponse.json({
      success: true,
      message: user ? "User found/created successfully" : "User not found",
      debugInfo,
    });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error checking/creating user",
        error: String(error),
      },
      { status: 500 },
    );
  }
}
