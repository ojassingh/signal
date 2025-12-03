import { Hero } from "@/components/landing-page/hero";
import { Nav } from "@/components/landing-page/nav";

export default function Home() {
  return (
    <main className="relative flex justify-center border-x-0">
      <div className="-z-10 absolute inset-0 bg-[repeating-linear-gradient(315deg,color-mix(in_oklab,var(--color-border),transparent_50%)_0,color-mix(in_oklab,var(--color-border),transparent_50%)_1px,transparent_0,transparent_50%)] bg-size-[10px_10px]" />
      <div className="relative mx-auto w-full max-w-7xl border-x bg-background">
        <Nav />
        <Hero />
      </div>
    </main>
  );
}
