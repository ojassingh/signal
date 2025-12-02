import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import icon from "@/app/icon.png";

export function Nav() {
  return (
    <header className="sticky top-0 py-3">
      <div className="max-w-7xl mx-auto flex justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src={icon} alt="Signal" width={25} height={25} />
          <span className="text-lg">Signal</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/#pricing" className="hover:text-muted-foreground transition-colors duration-100">Pricing</Link>
          <Link href="/#faq" className="hover:text-muted-foreground transition-colors duration-100">FAQ</Link>
        </div>
        <Link href="/sign-in">
          <Button variant="outline" className="rounded-full" size="sm">
            Sign In
          </Button>
        </Link>
      </div>
    </header>
  );
}
