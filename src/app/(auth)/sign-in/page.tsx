"use client";

import Link from "next/link";
import { AuthButton } from "@/app/(auth)/components/auth-buttons";

export default function SignInPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-center text-3xl">Welcome back!</h1>
        </div>
        <div className="flex flex-col gap-4">
          <AuthButton provider="google">Continue with Google</AuthButton>
          <AuthButton provider="github">Continue with GitHub</AuthButton>
          <p className="mt-4 text-center text-muted-foreground text-sm">
            <Link className="hover:underline" href="/sign-up">
              Don't have an account?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
