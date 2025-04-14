import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "~/server/service/userService";
import { getUserRole } from "~/utils/userUtils";

export async function GET(request: NextRequest) {
  try {
    // Get the current authenticated user
    const user = await getCurrentUser();

    // Check if user is authenticated
    if (!user || !user.id) {
      console.log("User not authenticated in check-role");
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    // Get user role from database
    const role = await getUserRole(user.id);

    // Log the role for debugging
    console.log(`User ${user.id} has role: ${role}`);

    if (!role) {
      return NextResponse.json(
        { success: false, error: "No role found for user" },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      role: role,
    });
  } catch (error) {
    console.error("Error checking user role:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check user role" },
      { status: 500 },
    );
  }
}
