import { NextResponse } from "next/server";
import { isUserModerator } from "~/server/service/userService";

export async function GET() {
  try {
    // Check if user is a moderator
    const isModerator = await isUserModerator();

    console.log(`Moderator status check result: ${isModerator}`);

    return NextResponse.json({ isModerator });
  } catch (error) {
    console.error("Error checking moderator status:", error);
    return NextResponse.json(
      { isModerator: false, error: "Failed to check moderator status" },
      { status: 500 },
    );
  }
}
