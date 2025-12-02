import { Nav } from "@/components/landing-page/nav";
import { Hero } from "@/components/landing-page/hero";

export default function Home() {
  return (
    <>
      <Nav />
      <div className="max-w-7xl mx-auto">
        <Hero />
      </div>
    </>
  );
}
