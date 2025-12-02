"use client";

import { GitHubIcon, GoogleIcon } from "@/app/(auth)/components/auth-icons";
import { Button } from "@/components/ui/button";
import { signIn } from "@/lib/auth-client";

export function AuthButton({
  provider,
  children,
}: {
  provider: "google" | "github";
  children: React.ReactNode;
}) {
  return (
    <Button
      className="w-full"
      onClick={() => signIn.social({ provider, callbackURL: "/dashboard" })}
      variant="outline"
    >
      {provider === "google" ? <GoogleIcon /> : <GitHubIcon />}
      {children}
    </Button>
  );
}
