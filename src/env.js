import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

// Check if we're in a build environment
const isBuildEnv =
  process.env.NODE_ENV === "production" &&
  process.env.VERCEL_ENV === "production";

// Default URLs for local development
const localUrl = "http://localhost:3000";
const dashboardUrl = "http://localhost:3000/dashboard";

// Production URLs
const prodUrl = "https://gameonbaby.vercel.app";
const prodDashboardUrl = "https://gameonbaby.vercel.app/dashboard";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    DATABASE_URL: z.string().url(),
    DATABASE_URL_NO_SSL: z.string().url(),
    DATABASE_URL_NON_POOLING: z.string().url(),
    DATABASE_PRISMA_URL: z.string().url(),
    DATABASE_HOST: z.string(),
    DATABASE_USER: z.string(),
    DATABASE_PASSWORD: z.string(),
    DATABASE_DATABASE: z.string(),
    KINDE_CLIENT_ID: isBuildEnv ? z.string().optional() : z.string(),
    KINDE_CLIENT_SECRET: isBuildEnv ? z.string().optional() : z.string(),
    KINDE_ISSUER_URL: isBuildEnv
      ? z.string().url().optional()
      : z.string().url(),
    KINDE_SITE_URL: isBuildEnv
      ? z.string().url().optional()
      : z.string().url().default(localUrl),
    KINDE_POST_LOGOUT_REDIRECT_URL: isBuildEnv
      ? z.string().url().optional()
      : z.string().url().default(localUrl),
    KINDE_POST_LOGIN_REDIRECT_URL: isBuildEnv
      ? z.string().url().optional()
      : z.string().url().default(dashboardUrl),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_RESEND_API_KEY: z.string(),
    NEXT_PUBLIC_BANK_ACCOUNT: z.string(),
    NEXT_PUBLIC_KINDE_AUTH_URL: isBuildEnv
      ? z.string().url().optional()
      : z.string().url(),
    NEXT_PUBLIC_KINDE_CLIENT_ID: isBuildEnv
      ? z.string().optional()
      : z.string(),
    NEXT_PUBLIC_KINDE_LOGOUT_URL: isBuildEnv
      ? z.string().url().optional()
      : z.string().url().default(localUrl),
    NEXT_PUBLIC_KINDE_REDIRECT_URL: isBuildEnv
      ? z.string().url().optional()
      : z.string().url().default(dashboardUrl),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_URL_NO_SSL: process.env.DATABASE_URL_NO_SSL,
    DATABASE_URL_NON_POOLING: process.env.DATABASE_URL_NON_POOLING,
    DATABASE_PRISMA_URL: process.env.DATABASE_PRISMA_URL,
    DATABASE_HOST: process.env.DATABASE_HOST,
    DATABASE_USER: process.env.DATABASE_USER,
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
    DATABASE_DATABASE: process.env.DATABASE_DATABASE,
    NEXT_PUBLIC_RESEND_API_KEY: process.env.NEXT_PUBLIC_RESEND_API_KEY,
    NEXT_PUBLIC_BANK_ACCOUNT: process.env.NEXT_PUBLIC_BANK_ACCOUNT,
    KINDE_CLIENT_ID: process.env.KINDE_CLIENT_ID,
    KINDE_CLIENT_SECRET: process.env.KINDE_CLIENT_SECRET,
    KINDE_ISSUER_URL: process.env.KINDE_ISSUER_URL,
    KINDE_SITE_URL: isBuildEnv
      ? prodUrl
      : process.env.KINDE_SITE_URL ?? localUrl,
    KINDE_POST_LOGOUT_REDIRECT_URL: isBuildEnv
      ? prodUrl
      : process.env.KINDE_POST_LOGOUT_REDIRECT_URL ?? localUrl,
    KINDE_POST_LOGIN_REDIRECT_URL: isBuildEnv
      ? prodDashboardUrl
      : process.env.KINDE_POST_LOGIN_REDIRECT_URL ?? dashboardUrl,
    NEXT_PUBLIC_KINDE_AUTH_URL: process.env.NEXT_PUBLIC_KINDE_AUTH_URL,
    NEXT_PUBLIC_KINDE_CLIENT_ID: process.env.NEXT_PUBLIC_KINDE_CLIENT_ID,
    NEXT_PUBLIC_KINDE_LOGOUT_URL: isBuildEnv
      ? prodUrl
      : process.env.NEXT_PUBLIC_KINDE_LOGOUT_URL ?? localUrl,
    NEXT_PUBLIC_KINDE_REDIRECT_URL: isBuildEnv
      ? prodDashboardUrl
      : process.env.NEXT_PUBLIC_KINDE_REDIRECT_URL ?? dashboardUrl,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
   * This is especially useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined.
   * `SOME_VAR: z.string()` and `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
