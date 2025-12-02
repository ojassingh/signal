"use client"

import { Button } from "@/components/ui/button"
import { GoogleIcon, GitHubIcon } from "@/app/(auth)/components/auth-icons"
import { signIn } from "@/lib/auth-client"

export function AuthButton({ provider, children }: { provider: "google" | "github"; children: React.ReactNode }) {
  return (
    <Button variant="outline" className="w-full" onClick={() => signIn.social({ provider, callbackURL: "/dashboard" })}>
      {provider === "google" ? <GoogleIcon /> : <GitHubIcon />}
      {children}
    </Button>
  )
}
