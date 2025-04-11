import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser || !kindeUser.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: kindeUser.email },
      select: { paymentPreference: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      paymentPreference: user.paymentPreference,
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
    const { getUser } = getKindeServerSession();
    const kindeUser = await getUser();

    if (!kindeUser || !kindeUser.email) {
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
      where: { email: kindeUser.email },
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
