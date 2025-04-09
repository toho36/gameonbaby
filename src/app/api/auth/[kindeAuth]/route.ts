import { handleAuth } from "@kinde-oss/kinde-auth-nextjs/server";

// Log for debugging
console.log("Kinde auth route loaded - [kindeAuth]");

// Create the handler for all methods
export const GET = handleAuth();
export const POST = handleAuth();
export const PUT = handleAuth();
export const DELETE = handleAuth();
export const PATCH = handleAuth();
