import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { sendWelcomeEmail } from "@/actions/email";
import { db } from "@/db/drizzle";
// biome-ignore lint/performance/noNamespaceImport: we need to use the schema object
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
    additionalFields: {
      activeDomain: {
        type: "string",
        required: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await sendWelcomeEmail({
            email: user.email,
            name: user.name,
          });
          console.log("Onboarding: Email sent to new user", user.email);
        },
      },
    },
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  plugins: [nextCookies()],
  trustedOrigins: [process.env.NEXT_PUBLIC_BASE_URL as string],
});
