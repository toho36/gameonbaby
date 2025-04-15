import { NextResponse } from "next/server";
import { isUserAdmin } from "~/server/service/userService";

export async function GET() {
  try {
    // Check if user is admin
    const isAdmin = await isUserAdmin();

    console.log(
      `User access check for registration history: isAdmin=${isAdmin}`,
    );

    if (isAdmin) {
      return NextResponse.json({
        success: true,
        hasAccess: true,
        role: "ADMIN",
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
