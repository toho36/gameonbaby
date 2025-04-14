import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { validateSession } from "../profile/route";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Use the shared validation function
    const sessionResult = await validateSession();

    if (!sessionResult.valid || !sessionResult.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      paymentPreference: sessionResult.user.paymentPreference || "CARD",
    });
  } catch (error) {
    console.error("Error fetching payment preference:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch payment preference" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Use the shared validation function
    const sessionResult = await validateSession();

    if (!sessionResult.valid || !sessionResult.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { paymentPreference } = await request.json();

    if (!["CARD", "CASH"].includes(paymentPreference)) {
      return NextResponse.json(
        { success: false, message: "Invalid payment preference" },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { email: sessionResult.user.email as string },
      data: { paymentPreference },
      select: { paymentPreference: true },
    });

    return NextResponse.json({
      success: true,
      paymentPreference: user.paymentPreference,
    });
  } catch (error) {
    console.error("Error updating payment preference:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update payment preference" },
      { status: 500 },
    );
  }
}
