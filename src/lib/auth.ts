import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { getDb } from "@/db";
import {
  authAccount,
  authSession,
  authUser,
  authVerification,
} from "@/db/schema";

const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);
const baseUrl =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "http://localhost:3000";

export const auth = betterAuth({
  appName: "Root Access",
  baseURL: baseUrl,
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: {
      account: authAccount,
      session: authSession,
      user: authUser,
      verification: authVerification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  plugins: [nextCookies()],
  secret:
    process.env.BETTER_AUTH_SECRET ??
    process.env.CLERK_SECRET_KEY ??
    "root-access-development-secret-change-before-production",
  socialProviders: googleConfigured
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : undefined,
  trustedOrigins: [
    baseUrl,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],
});

export type AuthSession = typeof auth.$Infer.Session;
