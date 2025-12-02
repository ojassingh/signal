import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Nav() {
  return (
    <header className="p-4 flex justify-end">
      <Link href="/sign-in">
        <Button variant="outline">Sign In</Button>
      </Link>
    </header>
  );
}
