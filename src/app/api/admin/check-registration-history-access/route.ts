import { NextResponse } from "next/server";
import { isUserAdmin, isUserModerator } from "~/server/service/userService";

export async function GET() {
  try {
    // Check if user is admin or moderator
    const [isAdmin, isModerator] = await Promise.all([
      isUserAdmin(),
      isUserModerator(),
    ]);

    console.log(
      `User access check for registration history: isAdmin=${isAdmin}, isModerator=${isModerator}`,
    );

    if (isAdmin || isModerator) {
      return NextResponse.json({
        success: true,
        hasAccess: true,
        role: isAdmin ? "ADMIN" : "MODERATOR",
      });
    }

    return NextResponse.json({
      success: true,
      hasAccess: false,
    });
  } catch (error) {
    console.error("Error checking registration history access:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check access" },
      { status: 500 },
    );
  }
}
