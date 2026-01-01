import { NextRequest } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "~/lib/db";

interface Participant {
  id?: string;
  first_name: string;
  last_name: string | null;
  created_at: Date;
  email?: string;
  payment_type?: string;
  attened?: boolean;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  // SSE headers
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no", // Nginx optimization
  });

  // Create encoder for sending events
  const encoder = new TextEncoder();

  // Function to send SSE event
  const sendEvent = (data: any) => {
    const message = `data: ${JSON.stringify(data)}\n\n`;
    return encoder.encode(message);
  };

  // Create readable stream
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial data immediately
      try {
        // Get current user for permission check
        const { getUser } = getKindeServerSession();
        const user = await getUser();

        // Fetch initial participant data
        const event = await prisma.event.findUnique({
          where: { id: params.id },
          select: {
            id: true,
            capacity: true,
          },
        });

        if (!event) {
          controller.enqueue(sendEvent({ type: "error", message: "Event not found" }));
          controller.close();
          return;
        }

        // Get registration count
        const registrationCount = await prisma.registration.count({
          where: {
            event_id: params.id,
            deleted: false,
          },
        });

        // Get waiting list count
        const waitingListCount = await prisma.waitingList.count({
          where: { event_id: params.id },
        });

        // Check if user is moderator
        const isModerator = user?.email ? await prisma.user.findFirst({
          where: { email: user.email },
          select: { role: true },
        }).then(u => u?.role === "MODERATOR" || u?.role === "ADMIN") : false;

        // Fetch participants (limited)
        const registrations = await prisma.registration.findMany({
          where: {
            event_id: params.id,
            deleted: false,
          },
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: isModerator,
            payment_type: isModerator,
            created_at: true,
            attended: isModerator,
          },
          orderBy: { created_at: "asc" },
          take: 20,
        });

        // Fetch waiting list (limited)
        const waitingList = await prisma.waitingList.findMany({
          where: { event_id: params.id },
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: isModerator,
            payment_type: isModerator,
            created_at: true,
          },
          orderBy: { created_at: "asc" },
          take: 20,
        });

        // Send initial state
        controller.enqueue(
          sendEvent({
            type: "participants:update",
            data: {
              registrations,
              waitingList,
              registrationCount,
              waitingListCount,
              capacity: event.capacity,
              isModerator,
            },
          })
        );

        // Setup heartbeat (every 30 seconds to keep connection alive)
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(sendEvent({ type: "heartbeat" }));
          } catch (error) {
            // Connection already closed
            clearInterval(heartbeat);
          }
        }, 30000);

        // Cleanup on request abort
        request.signal.addEventListener("abort", () => {
          clearInterval(heartbeat);
          controller.close();
        });
      } catch (error) {
        console.error("SSE Stream error:", error);
        controller.enqueue(
          sendEvent({ type: "error", message: "Internal server error" })
        );
        controller.close();
      }
    },
  });

  return new Response(stream, { headers });
}
