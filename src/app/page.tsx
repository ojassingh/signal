import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 flex justify-end">
        <Link href="/sign-in">
          <Button variant="outline">Sign In</Button>
        </Link>
      </header>
      <main className="flex-1 flex items-center justify-center">
        <h1 className="text-4xl">Signal home page</h1>
      </main>
    </div>
  );
}
