import { Hero } from "@/components/landing-page/hero";
import { Nav } from "@/components/landing-page/nav";

export default function Home() {
  return (
    <>
      <Nav />
      <div className="mx-auto max-w-7xl">
        <Hero />
      </div>
    </>
  );
}
