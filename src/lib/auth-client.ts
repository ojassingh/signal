import { createAuthClient } from "better-auth/react" // make sure to import from better-auth/react
 export const { signIn, signUp, useSession } =  createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL,
})
