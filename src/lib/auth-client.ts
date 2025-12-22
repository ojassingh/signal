import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

export const { signIn, signUp, useSession, signOut, getSession } =
  createAuthClient({
    plugins: [inferAdditionalFields<typeof auth>()],
  });
