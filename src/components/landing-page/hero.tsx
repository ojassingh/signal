import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <div className="grid h-screen grid-rows-12 place-content-center bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-border)_75%,black)_1px,transparent_1px)] bg-size-[16px_16px]">
      <div className="row-start-4 mx-auto max-w-xl text-center">
        <h1 className="mt-4 font-medium text-5xl tracking-tight">
          Signal is an AI assistant for revenue analytics
        </h1>
        <p className="mt-6 text-pretty text-lg text-muted-foreground">
          Signal tracks which marketing channels drive growth <br /> and shows
          you how to scale them.
        </p>
        <div className="mt-6 flex place-content-center gap-2">
          <Button
            className="inset-shadow-primary inset-shadow-sm rounded-full text-white backdrop-blur-sm"
            variant="outline"
          >
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
