import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <div className="relative grid h-screen grid-rows-12 place-content-center">
      <div className="row-start-4 mx-auto text-center">
        <h1 className="mx-auto mt-4 max-w-2xl text-pretty text-5xl tracking-tight">
          Signal is your AI Growth Engine
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-pretty text-center text-lg text-muted-foreground">
          Signal quantifies which of your channels drive growth <br /> and shows
          how to scale them fast. Fully open-source.
        </p>
        <div className="mt-6 flex place-content-center gap-2">
          <Button className="inset-shadow-md" variant="sexy">
            Start 14-day free trial
          </Button>
          <Button className="rounded-full backdrop-blur-sm" variant="outline">
            Demo
          </Button>
        </div>
      </div>
    </div>
  );
}
