import { Hero } from "@/components/landing-page/hero";
import { Nav } from "@/components/landing-page/nav";

export default function Home() {
  return (
    <main className="mx-auto max-w-7xl border-x">
      <Nav />
      <div className="px-8">
        <Hero />
      </div>
    </main>
  );
}
