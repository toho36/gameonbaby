import { NextRequest, NextResponse } from "next/server";
import prisma from "~/lib/db";
import { getCurrentUser } from "~/server/service/userService";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Get the current authenticated user
    const user = await getCurrentUser();

    // Check if user is authenticated
    if (!user || !user.id) {
      return NextResponse.json(
        { success: false, error: "You must be logged in to unregister" },
        { status: 401 },
      );
    }

    const eventId = params.id;

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: {
        id: eventId,
      },
    });

    if (!event) {
      return NextResponse.json(
        { success: false, error: "Event not found" },
        { status: 404 },
      );
    }

    // Check if the event is in the past
    if (new Date(event.to) < new Date()) {
      return NextResponse.json(
        { success: false, error: "Cannot unregister from past events" },
        { status: 400 },
      );
    }

    // Check if user is registered for this event
    // Only search by email if it exists
    if (!user.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Your account does not have an email address",
        },
        { status: 400 },
      );
    }

    const registration = await prisma.registration.findFirst({
      where: {
        event_id: eventId,
        email: user.email,
      },
    });

    if (!registration) {
      return NextResponse.json(
        { success: false, error: "You are not registered for this event" },
        { status: 400 },
      );
    }

    // Delete the registration
    await prisma.registration.delete({
      where: {
        id: registration.id,
      },
    });

    // Check if there's anyone on the waiting list for this event
    const waitingListEntry = await prisma.waitingList.findFirst({
      where: {
        event_id: eventId,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    if (waitingListEntry) {
      // Move the first person from the waiting list to registrations
      await prisma.registration.create({
        data: {
          event_id: eventId,
          first_name: waitingListEntry.first_name,
          last_name: waitingListEntry.last_name,
          email: waitingListEntry.email,
          phone_number: waitingListEntry.phone_number,
          payment_type: waitingListEntry.payment_type,
          created_at: new Date(),
        },
      });

      // Delete the entry from the waiting list
      await prisma.waitingList.delete({
        where: {
          id: waitingListEntry.id,
        },
      });

      // TODO: Send notification email to the person moved from waiting list
    }

    return NextResponse.json({
      success: true,
      message: "Successfully unregistered from event",
    });
  } catch (error) {
    console.error("Error unregistering from event:", error);
    return NextResponse.json(
      { success: false, error: "Failed to unregister from event" },
      { status: 500 },
    );
  }
}
