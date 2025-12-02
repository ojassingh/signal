import Image from "next/image";
import Link from "next/link";
import icon from "@/app/icon.png";
import { Button } from "@/components/ui/button";

export function Nav() {
  return (
    <header className="sticky top-0 py-3">
      <div className="mx-auto flex max-w-7xl justify-between">
        <Link className="flex items-center gap-2" href="/">
          <Image alt="Signal" height={25} src={icon} width={25} />
          <span className="text-lg">Signal</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link
            className="transition-colors duration-100 hover:text-muted-foreground"
            href="/#pricing"
          >
            Pricing
          </Link>
          <Link
            className="transition-colors duration-100 hover:text-muted-foreground"
            href="/#faq"
          >
            FAQ
          </Link>
        </div>
        <Link href="/sign-in">
          <Button className="rounded-full" size="sm" variant="outline">
            Sign In
          </Button>
        </Link>
      </div>
    </header>
  );
}
