import { NextRequest, NextResponse } from "next/server";
import {
  handleAuth,
  getKindeServerSession,
} from "@kinde-oss/kinde-auth-nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest, response: NextResponse) {
  try {
    // First, let Kinde handle the auth flow
    await handleAuth()(request, response);

    // Then sync user to our database
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (kindeUser && kindeUser.id) {
      // Check if user exists
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            // @ts-ignore: Property doesn't exist
            { kindeId: kindeUser.id },
            { email: kindeUser.email },
          ],
        },
      });

      const name =
        `${kindeUser.given_name || ""} ${kindeUser.family_name || ""}`.trim();

      // If user doesn't exist, create it
      if (!user) {
        await prisma.user.create({
          data: {
            // @ts-ignore: Property doesn't exist
            kindeId: kindeUser.id,
            email: kindeUser.email || "",
            name: name,
            // @ts-ignore: Property doesn't exist
            role: "USER",
          },
        });
        console.log("User created on login callback:", kindeUser.email);
      }
      // If found by email but no kindeId, update it
      else if (!user.kindeId) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            // @ts-ignore: Property doesn't exist
            kindeId: kindeUser.id,
          },
        });
        console.log("User updated on login callback:", kindeUser.email);
      }
    }

    // Redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (error) {
    console.error("Error in Kinde callback:", error);
    // Still redirect to dashboard even if there's an error with our sync
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
}
