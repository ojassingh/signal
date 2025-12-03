import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <div className="relative grid h-screen grid-rows-12 place-content-center bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-border)_75%,black)_1px,transparent_1px)] bg-size-[20px_20px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,transparent_50%,var(--color-background)_100%)]" />
      <div className="row-start-4 mx-auto text-center">
        <h1 className="mx-auto mt-4 max-w-2xl text-pretty text-5xl tracking-tight">
          Signal is an AI marketing assistant for revenue analytics
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-pretty text-center text-lg text-muted-foreground">
          Signal tracks which of your marketing channels drive growth <br /> and
          shows how to scale them fast.
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
