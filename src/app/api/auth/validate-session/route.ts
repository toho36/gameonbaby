import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function GET() {
  try {
    // Get the authenticated user from Kinde
    const { getUser, getAccessToken } = getKindeServerSession();
    const kindeUser = await getUser();

    // If no user is found or the ID is missing, session is invalid
    if (!kindeUser || !kindeUser.id) {
      return NextResponse.json(
        { error: "Authentication session expired or invalid" },
        { status: 401 },
      );
    }

    // Get fresh access token to extend session lifetime
    const token = await getAccessToken();

    // Session is valid
    return NextResponse.json({
      valid: true,
      // Just return that token exists, no need to access properties
      token_refreshed: !!token,
    });
  } catch (error) {
    console.error("Error validating session:", error);

    // If there's an error, assume session is invalid
    return NextResponse.json(
      { error: "Failed to validate authentication session" },
      { status: 401 },
    );
  }
}
